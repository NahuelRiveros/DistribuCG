import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { Usuario } from "../usuarios/modelos.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";

const app = crearApp();
let staff, ana, beto;
let yerba, yerbaKilo, agua; // variantes

const como = (usuario) => ({
  get: (url) => request(app).get(url).set(...autorizacion(usuario)),
  post: (url, body) => request(app).post(url).set(...autorizacion(usuario)).send(body),
  put: (url, body) => request(app).put(url).set(...autorizacion(usuario)).send(body),
  patch: (url, body) => request(app).patch(url).set(...autorizacion(usuario)).send(body),
  delete: (url) => request(app).delete(url).set(...autorizacion(usuario)),
});

beforeAll(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  staff = await crearUsuario({ email: "staff@tienda.com", roles: ["staff"] });
  ana = await crearUsuario({ email: "ana@tienda.com" });
  beto = await crearUsuario({ email: "beto@tienda.com" });
});
afterAll(() => sequelize.close());

beforeEach(async () => {
  await vaciarTablas("operacion_idempotente", "carrito_item", "carrito", "perfil_cliente", "movimiento_stock", "stock", "producto_imagen", "variante", "producto", "categoria");
  const panel = como(staff);
  const categoria = (await panel.post("/api/catalogo/categorias", { nombre: "Almacén" })).body.data;
  [yerba, yerbaKilo] = (await panel.post("/api/catalogo/productos", {
    categoria_id: categoria.id,
    nombre: "Yerba",
    variantes: [{ nombre: "500 g", sku: "Y500", precio: 1000 }, { nombre: "1 kg", sku: "Y1K", precio: "1800.50", iva_porcentaje: 10.5 }],
  })).body.data.variantes;
  agua = (await panel.post("/api/catalogo/productos", { categoria_id: categoria.id, nombre: "Agua", variantes: [{ sku: "AGU", precio: 500 }] })).body.data.variantes[0];
  await panel.post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 5 }] }); // Yerba 500 g: controla stock (5)
});

describe("Registro de clientes", () => {
  beforeEach(() => Usuario.destroy({ where: { email: "nueva@tienda.com" }, force: true }).catch(() => {}));

  it("crea la cuenta con rol cliente y deja la sesión iniciada", async () => {
    const res = await request(app).post("/api/auth/registro").send({ nombre: "Nueva", email: " NUEVA@tienda.com ", contrasena: "clave-segura" });
    expect(res.status).toBe(201);
    expect(res.body.data.usuario).toMatchObject({ email: "nueva@tienda.com", roles: ["cliente"] });
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it("no permite repetir el email y exige contraseña de 8 caracteres", async () => {
    const repetido = await request(app).post("/api/auth/registro").send({ nombre: "Ana", email: "ana@tienda.com", contrasena: "clave-segura" });
    expect(repetido.body.codigo).toBe("EMAIL_REGISTRADO");
    const corta = await request(app).post("/api/auth/registro").send({ nombre: "X", email: "x@y.com", contrasena: "123" });
    expect(corta.body.detalles.map((d) => d.mensaje)).toContain("La contraseña tiene que tener al menos 8 caracteres");
  });
});

describe("Datos de entrega", () => {
  it("se guardan, se leen y validan teléfono, provincia y CUIT", async () => {
    expect((await como(ana).get("/api/tienda/perfil")).body.data).toBeNull();

    const invalido = await como(ana).put("/api/tienda/perfil", { telefono: "abc", direccion: "", localidad: "Salta", provincia: "Narnia", cuit: "20-123" });
    expect([...new Set(invalido.body.detalles.map((d) => d.campo))].sort()).toEqual(["cuit", "direccion", "provincia", "telefono"]);

    const ok = await como(ana).put("/api/tienda/perfil", {
      telefono: "387 555-1234",
      direccion: "Belgrano 123",
      localidad: "Salta",
      provincia: "Salta",
      cuit: "20-12345678-9",
      condicion_iva: "monotributista",
    });
    expect(ok.body.data).toMatchObject({ telefono: "387 555-1234", cuit: "20123456789", codigo_postal: null });
    expect((await como(beto).get("/api/tienda/perfil")).body.data).toBeNull(); // cada uno ve lo suyo
  });
});

describe("Carrito", () => {
  it("suma cantidades, calcula precios con IVA y totales", async () => {
    await como(ana).post("/api/tienda/carrito/items", { variante_id: yerbaKilo.id, cantidad: 2 });
    const res = await como(ana).post("/api/tienda/carrito/items", { variante_id: yerbaKilo.id, cantidad: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({ cantidad: 3, precio_final_unitario: 1989.55, subtotal_final: 5968.65, problema: null });
    expect(res.body.data.totales).toEqual({ subtotal_neto: 5401.5, iva: 567.15, total: 5968.65 });
    expect(res.body.data.se_puede_enviar).toBe(true);
  });

  it("no deja agregar más de lo disponible sin revelar la cantidad exacta", async () => {
    await como(ana).post("/api/tienda/carrito/items", { variante_id: yerba.id, cantidad: 4 });
    const res = await como(ana).post("/api/tienda/carrito/items", { variante_id: yerba.id, cantidad: 2 });
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("No hay stock suficiente de Yerba (500 g) para esa cantidad.");
    // Sin control de stock no hay límite
    expect((await como(ana).post("/api/tienda/carrito/items", { variante_id: agua.id, cantidad: 500 })).status).toBe(201);
  });

  it("marca problemas cuando algo cambia después de agregarlo", async () => {
    await como(ana).post("/api/tienda/carrito/items", { variante_id: yerba.id, cantidad: 3 });
    await como(ana).post("/api/tienda/carrito/items", { variante_id: agua.id, cantidad: 1 });

    await como(staff).post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 2, motivo: "Conteo" });
    const producto = (await como(staff).get(`/api/catalogo/productos/${agua.producto_id}`)).body.data;
    await como(staff).put(`/api/catalogo/productos/${producto.id}`, { categoria_id: producto.categoria_id, nombre: "Agua", variantes: [{ id: agua.id, sku: "AGU", precio: 600 }] });

    const carrito = (await como(ana).get("/api/tienda/carrito")).body.data;
    const [lineaYerba, lineaAgua] = carrito.items;
    expect(lineaYerba).toMatchObject({ problema: "stock_insuficiente" });
    expect(lineaAgua).toMatchObject({ problema: null, precio_cambio: true });
    expect(carrito.se_puede_enviar).toBe(false);

    await como(staff).patch(`/api/catalogo/productos/${producto.id}/estado`, { publicado: false });
    const despublicado = (await como(ana).get("/api/tienda/carrito")).body.data.items[1];
    expect(despublicado).toMatchObject({ problema: "no_disponible", mensaje: "Este producto ya no está disponible." });
  });

  it("cambia cantidades (bajar siempre se puede), quita y vacía", async () => {
    const item = (await como(ana).post("/api/tienda/carrito/items", { variante_id: yerba.id, cantidad: 5 })).body.data.items[0];
    expect((await como(ana).patch(`/api/tienda/carrito/items/${item.item_id}`, { cantidad: 6 })).status).toBe(409);
    expect((await como(ana).patch(`/api/tienda/carrito/items/${item.item_id}`, { cantidad: 2 })).body.data.items[0].cantidad).toBe(2);

    expect((await como(beto).delete(`/api/tienda/carrito/items/${item.item_id}`)).body.data.items).toEqual([]); // no toca el de Ana
    expect((await como(ana).get("/api/tienda/carrito")).body.data.items).toHaveLength(1);

    expect((await como(ana).delete(`/api/tienda/carrito/items/${item.item_id}`)).body.data.items).toEqual([]);
  });
});

describe("Carrito de visitante", () => {
  it("se cotiza sin cuenta con los mismos cálculos", async () => {
    const res = await request(app).post("/api/tienda/carrito/cotizar").send({ items: [{ variante_id: yerba.id, cantidad: 2 }, { variante_id: 99999, cantidad: 1 }] });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0]).toMatchObject({ producto: "Yerba", subtotal_final: 2420 });
    expect(res.body.data.items[1]).toMatchObject({ problema: "no_disponible" });
    expect(res.body.data.totales.total).toBe(2420);
  });

  it("al iniciar sesión se fusiona una sola vez, recortando a lo disponible", async () => {
    await como(ana).post("/api/tienda/carrito/items", { variante_id: yerba.id, cantidad: 3 });
    const clave = randomUUID();
    const items = [{ variante_id: yerba.id, cantidad: 4 }, { variante_id: agua.id, cantidad: 2 }];

    const res = await como(ana).post("/api/tienda/carrito/fusionar", { clave, items });
    expect(res.body.data.items.map((i) => [i.producto, i.cantidad])).toEqual([["Yerba", 5], ["Agua", 2]]);
    expect(res.body.data.avisos).toEqual(["No hay stock suficiente de Yerba (500 g) para esa cantidad."]);

    const repetida = await como(ana).post("/api/tienda/carrito/fusionar", { clave, items });
    expect(repetida.body.data.items.find((i) => i.producto === "Agua").cantidad).toBe(2); // no duplica
  });
});
