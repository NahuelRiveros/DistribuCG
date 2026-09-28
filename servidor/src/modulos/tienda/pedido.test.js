import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { proyecto } from "compartido/proyecto.js";
import { descuentoDe, mediosTienda } from "compartido/reglas/pagos.js";
import { guardar, olvidarConfiguracion } from "../configuracion/configuracion_servicio.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";

const app = crearApp();
let staff, ana, beto;
let yerba, agua;

const como = (usuario) => ({
  get: (url) => request(app).get(url).set(...autorizacion(usuario)),
  post: (url, body) => request(app).post(url).set(...autorizacion(usuario)).send(body),
  put: (url, body) => request(app).put(url).set(...autorizacion(usuario)).send(body),
  patch: (url, body) => request(app).patch(url).set(...autorizacion(usuario)).send(body),
});
const PERFIL = { telefono: "387 555 1234", direccion: "Belgrano 123", localidad: "Salta", provincia: "Salta" };

beforeAll(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  staff = await crearUsuario({ email: "staff@pedidos.com", roles: ["staff"] });
  ana = await crearUsuario({ email: "ana@pedidos.com" });
  beto = await crearUsuario({ email: "beto@pedidos.com" });
});
afterAll(() => sequelize.close());

beforeEach(async () => {
  await vaciarTablas(
    "pedido_cobro", "pedido_estado_log", "pedido_item", "pedido", "operacion_idempotente", "carrito_item", "carrito",
    "perfil_cliente", "movimiento_stock", "stock", "producto_imagen", "variante", "producto", "categoria",
  );
  const panel = como(staff);
  const categoria = (await panel.post("/api/catalogo/categorias", { nombre: "Almacén" })).body.data;
  yerba = (await panel.post("/api/catalogo/productos", { categoria_id: categoria.id, nombre: "Yerba", variantes: [{ nombre: "500 g", sku: "Y500", precio: 1000 }] })).body.data.variantes[0];
  agua = (await panel.post("/api/catalogo/productos", { categoria_id: categoria.id, nombre: "Agua", variantes: [{ sku: "AGU", precio: 500 }] })).body.data.variantes[0];
  await panel.post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 5 }] });
  await como(ana).put("/api/tienda/perfil", PERFIL);
  await como(beto).put("/api/tienda/perfil", PERFIL);
});

async function armarYEnviar(usuario, items, extra = {}) {
  let carrito;
  for (const item of items) carrito = (await como(usuario).post("/api/tienda/carrito/items", item)).body.data;
  const esperado = carrito.items.map((l) => ({ variante_id: l.variante_id, cantidad: l.cantidad, precio_final_unitario: l.precio_final_unitario }));
  return como(usuario).post("/api/tienda/pedidos", { clave: randomUUID(), modalidad_entrega: "envio", medio_pago: "efectivo", descuento_esperado: 0, esperado, ...extra });
}
const existencia = async (variante) => (await como(staff).get(`/api/stock/variantes/${variante.id}/movimientos`)).body.existencia;
const cambiar = (id, cuerpo) => como(staff).patch(`/api/pedidos/${id}/estado`, cuerpo);

describe("Envío del pedido", () => {
  it("guarda la copia fija, reserva el stock y vacía el carrito", async () => {
    const res = await armarYEnviar(ana, [{ variante_id: yerba.id, cantidad: 3 }, { variante_id: agua.id, cantidad: 2 }], { notas: "Tocar timbre" });
    expect(res.status).toBe(201);
    const pedido = res.body.data;
    expect(pedido).toMatchObject({ estado: "pendiente", estado_cobro: "pendiente", stock_fase: "reservado", total: "4840.00", saldo: 4840, notas: "Tocar timbre" });
    expect(pedido.entrega).toMatchObject({ email: "ana@pedidos.com", direccion: "Belgrano 123" });
    expect(pedido.items.map((i) => [i.nombre_producto, i.cantidad, i.precio_final_unitario, i.controla_stock])).toEqual([
      ["Yerba", 3, "1210.00", true],
      ["Agua", 2, "605.00", false],
    ]);
    expect(pedido.historial).toHaveLength(1);

    expect(await existencia(yerba)).toMatchObject({ cantidad: 5, reservado: 3, disponible: 2 });
    expect((await como(ana).get("/api/tienda/carrito")).body.data.items).toEqual([]);
  });

  it("el medio de pago con descuento baja el total del pedido (lo calcula el servidor)", async () => {
    // El % sale de la configuración del proyecto: el test no depende de los datos cargados
    const conDescuento = mediosTienda().find((m) => m.descuento > 0);
    if (!conDescuento) return;
    const res = await armarYEnviar(ana, [{ variante_id: yerba.id, cantidad: 2 }], { medio_pago: conDescuento.valor, descuento_esperado: conDescuento.descuento });
    expect(res.status).toBe(201);
    const descuento = Math.round(2420 * descuentoDe(conDescuento.valor)) / 100;
    expect(res.body.data).toMatchObject({
      medio_pago: conDescuento.valor,
      subtotal_neto: "2000.00",
      total_iva: "420.00",
      descuento: descuento.toFixed(2),
      total: (2420 - descuento).toFixed(2),
      saldo: 2420 - descuento,
    });
  });

  it("si el admin cambió el descuento mientras el cliente confirmaba, avisa en vez de cobrar otro total", async () => {
    const pagos = structuredClone(proyecto.pagos);
    const medio = pagos.medios.find((m) => m.en_tienda);
    const visto = medio.descuento;
    medio.descuento = visto + 5;
    await guardar(staff, "pagos", { valor: pagos, version: null });
    try {
      const res = await armarYEnviar(ana, [{ variante_id: agua.id, cantidad: 1 }], { medio_pago: medio.valor, descuento_esperado: visto });
      expect(res.status).toBe(409);
      expect(res.body.codigo).toBe("DESCUENTO_CAMBIO");
    } finally {
      await vaciarTablas("configuracion_cambio", "configuracion");
      olvidarConfiguracion();
    }
  });

  it("exige elegir un medio de pago de la tienda", async () => {
    const sinMedio = await armarYEnviar(ana, [{ variante_id: agua.id, cantidad: 1 }], { medio_pago: undefined });
    expect(sinMedio.status).toBe(400);
    expect(sinMedio.body.detalles).toEqual([{ campo: "medio_pago", mensaje: "Elegí cómo vas a pagar" }]);
    // "otro" existe para los cobros del panel, pero el cliente no lo puede elegir
    const noOfrecido = await como(ana).post("/api/tienda/pedidos", { clave: randomUUID(), modalidad_entrega: "envio", medio_pago: "otro", esperado: [{ variante_id: agua.id, cantidad: 1, precio_final_unitario: 605 }] });
    expect(noOfrecido.status).toBe(400);
  });

  it("repetir el envío con la misma clave devuelve el mismo pedido (sin duplicar)", async () => {
    const carrito = (await como(ana).post("/api/tienda/carrito/items", { variante_id: agua.id, cantidad: 1 })).body.data;
    const cuerpo = { clave: randomUUID(), modalidad_entrega: "retiro", medio_pago: "efectivo", descuento_esperado: 0, esperado: [{ variante_id: agua.id, cantidad: 1, precio_final_unitario: carrito.items[0].precio_final_unitario }] };
    const primero = await como(ana).post("/api/tienda/pedidos", cuerpo);
    const segundo = await como(ana).post("/api/tienda/pedidos", cuerpo);
    expect(segundo.body.data.id).toBe(primero.body.data.id);
    expect((await como(ana).get("/api/tienda/pedidos")).body.paginacion.total).toBe(1);
  });

  it("avisa si cambió el precio desde que el cliente lo revisó", async () => {
    await como(ana).post("/api/tienda/carrito/items", { variante_id: agua.id, cantidad: 1 });
    const res = await como(ana).post("/api/tienda/pedidos", { clave: randomUUID(), modalidad_entrega: "envio", medio_pago: "efectivo", descuento_esperado: 0, esperado: [{ variante_id: agua.id, cantidad: 1, precio_final_unitario: 1 }] });
    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe("CARRITO_CAMBIO");
  });

  it("pide los datos de entrega antes de enviar", async () => {
    const carlos = await crearUsuario({ email: `carlos-${randomUUID()}@pedidos.com` });
    const res = await armarYEnviar(carlos, [{ variante_id: agua.id, cantidad: 1 }]);
    expect(res.body.codigo).toBe("PERFIL_INCOMPLETO");
  });

  it("dos clientes a la vez por más de lo que hay: solo uno se lleva el stock", async () => {
    const preparar = async (usuario) => {
      const carrito = (await como(usuario).post("/api/tienda/carrito/items", { variante_id: yerba.id, cantidad: 3 })).body.data;
      return { clave: randomUUID(), modalidad_entrega: "envio", medio_pago: "efectivo", descuento_esperado: 0, esperado: [{ variante_id: yerba.id, cantidad: 3, precio_final_unitario: carrito.items[0].precio_final_unitario }] };
    };
    const [cuerpoAna, cuerpoBeto] = [await preparar(ana), await preparar(beto)];
    const resultados = await Promise.all([como(ana).post("/api/tienda/pedidos", cuerpoAna), como(beto).post("/api/tienda/pedidos", cuerpoBeto)]);

    expect(resultados.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(["CARRITO_CON_PROBLEMAS", "STOCK_INSUFICIENTE"]).toContain(resultados.find((r) => r.status === 409).body.codigo);
    expect(await existencia(yerba)).toMatchObject({ reservado: 3, disponible: 2 });
  });
});

describe("Estados y stock", () => {
  let pedido;
  beforeEach(async () => {
    pedido = (await armarYEnviar(ana, [{ variante_id: yerba.id, cantidad: 3 }])).body.data;
  });

  it("recorrido completo: reservar → descontar al preparar → devolver al cancelar → reservar al reabrir", async () => {
    expect((await cambiar(pedido.id, { estado: "en_preparacion" })).body.data.stock_fase).toBe("descontado");
    expect(await existencia(yerba)).toMatchObject({ cantidad: 2, reservado: 0 });

    await cambiar(pedido.id, { estado: "entregado" });
    expect((await existencia(yerba)).cantidad).toBe(2); // ya estaba descontado

    const sinMotivo = await cambiar(pedido.id, { estado: "en_preparacion" });
    expect(sinMotivo.body.mensaje).toBe("Indicá el motivo del cambio.");
    await cambiar(pedido.id, { estado: "en_preparacion", motivo: "Se cargó mal la entrega" });
    const cancelado = await cambiar(pedido.id, { estado: "cancelado", motivo: "El cliente no lo quiere" });
    expect(cancelado.body.data.stock_fase).toBe("ninguna");
    expect(await existencia(yerba)).toMatchObject({ cantidad: 5, reservado: 0 });

    const reabierto = await cambiar(pedido.id, { estado: "pendiente", motivo: "Lo volvió a pedir" });
    expect(reabierto.body.data.stock_fase).toBe("reservado");
    expect(reabierto.body.data.historial.map((h) => h.estado_nuevo)).toEqual(["pendiente", "en_preparacion", "entregado", "en_preparacion", "cancelado", "pendiente"]);
    expect((await como(staff).get("/api/stock/conciliacion")).body.data.correcto).toBe(true);
  });

  it("rechaza saltos no permitidos y cambios simultáneos", async () => {
    const salto = await cambiar(pedido.id, { estado: "entregado" });
    expect(salto.body.codigo).toBe("TRANSICION_INVALIDA");

    await cambiar(pedido.id, { estado: "en_preparacion", estado_actual: "pendiente" });
    const viejo = await cambiar(pedido.id, { estado: "cancelado", motivo: "x".repeat(5), estado_actual: "pendiente" });
    expect(viejo.body.codigo).toBe("PEDIDO_CAMBIO");
  });

  it("reabrir sin stock suficiente avisa y no cambia nada", async () => {
    await cambiar(pedido.id, { estado: "cancelado", motivo: "Cancelado" });
    await como(staff).post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 1, motivo: "Conteo" });
    const res = await cambiar(pedido.id, { estado: "pendiente", motivo: "Reabrir" });
    expect(res.body.codigo).toBe("STOCK_INSUFICIENTE");
    expect((await como(staff).get(`/api/pedidos/${pedido.id}`)).body.data.estado).toBe("cancelado");
  });
});

describe("Cobros", () => {
  let pedido;
  beforeEach(async () => {
    pedido = (await armarYEnviar(ana, [{ variante_id: agua.id, cantidad: 2 }])).body.data; // total 1210
  });
  const cobrar = (cuerpo) => como(staff).post(`/api/pedidos/${pedido.id}/cobros`, cuerpo);

  it("registra cobros parciales hasta cubrir el total y no permite pasarse", async () => {
    expect((await cobrar({ monto: "500", metodo: "efectivo" })).body.data).toMatchObject({ estado_cobro: "parcial", monto_cobrado: "500.00", saldo: 710 });
    const pasado = await cobrar({ monto: 800, metodo: "transferencia" });
    expect(pasado.body.mensaje).toBe("El cobro supera el saldo del pedido ($ 710,00).");
    expect((await cobrar({ monto: "710", metodo: "transferencia", nota: "CBU terminado en 123" })).body.data).toMatchObject({ estado_cobro: "cobrado", saldo: 0 });
  });

  it("anular un cobro lo conserva con motivo y recalcula el saldo", async () => {
    const conCobro = (await cobrar({ monto: 1210, metodo: "efectivo" })).body.data;
    const anulado = await como(staff).post(`/api/pedidos/${pedido.id}/cobros/${conCobro.cobros[0].id}/anular`, { motivo: "Se cargó dos veces" });
    expect(anulado.body.data).toMatchObject({ estado_cobro: "pendiente", saldo: 1210 });
    expect(anulado.body.data.cobros[0]).toMatchObject({ motivo_anulacion: "Se cargó dos veces" });
    expect(anulado.body.data.cobros[0].anulado_por_usuario.id).toBe(staff.id);
  });

  it("no se cobra un pedido cancelado", async () => {
    await cambiar(pedido.id, { estado: "cancelado", motivo: "Cancelado" });
    expect((await cobrar({ monto: 100, metodo: "efectivo" })).body.codigo).toBe("PEDIDO_CANCELADO");
  });
});

describe("Permisos y listados", () => {
  it("un cliente solo ve sus pedidos y no puede gestionarlos", async () => {
    const pedido = (await armarYEnviar(ana, [{ variante_id: agua.id, cantidad: 1 }])).body.data;
    expect((await como(beto).get(`/api/tienda/pedidos/${pedido.id}`)).status).toBe(404);
    expect((await como(ana).get(`/api/tienda/pedidos/${pedido.id}`)).status).toBe(200);
    expect((await como(beto).get("/api/tienda/pedidos")).body.data).toEqual([]);
    expect((await como(ana).patch(`/api/pedidos/${pedido.id}/estado`, { estado: "cancelado", motivo: "Me arrepentí" })).status).toBe(403);
  });

  it("el panel filtra por cliente, número y estado, y resume lo pendiente", async () => {
    const deAna = (await armarYEnviar(ana, [{ variante_id: agua.id, cantidad: 1 }])).body.data;
    await armarYEnviar(beto, [{ variante_id: agua.id, cantidad: 1 }]);

    const porEmail = await como(staff).get("/api/pedidos?q=ana@");
    expect(porEmail.body.data.map((p) => p.id)).toEqual([deAna.id]);
    expect(porEmail.body.data[0].cantidad_items).toBe(1);
    expect((await como(staff).get(`/api/pedidos?q=%23${deAna.id}`)).body.data).toHaveLength(1);
    expect((await como(staff).get("/api/pedidos?estado=pendiente")).body.paginacion.total).toBe(2);
    expect((await como(staff).get("/api/pedidos/resumen")).body.data).toEqual({ nuevos: 2, en_preparacion: 0, por_cobrar: 2 });
  });
});
