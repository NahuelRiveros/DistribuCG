import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";
import { registrarMovimiento, registrarMovimientos } from "./movimientos.js";

const app = crearApp();
let staff, cliente;
let yerba, azucar; // variantes

beforeAll(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  staff = await crearUsuario({ email: "staff@stock.com", roles: ["staff"] });
  cliente = await crearUsuario({ email: "cliente@stock.com", roles: ["cliente"] });
});
afterAll(() => sequelize.close());

const post = (url, body, usuario = staff) => request(app).post(url).set(...autorizacion(usuario)).send(body);
const get = (url, usuario = staff) => request(app).get(url).set(...autorizacion(usuario));
const existencia = async (variante) => (await get(`/api/stock/variantes/${variante.id}/movimientos`)).body.existencia;
const enTransaccion = (datos) => sequelize.transaction((transaction) => registrarMovimiento(datos, { transaction }));

beforeEach(async () => {
  await vaciarTablas("movimiento_stock", "stock", "producto_imagen", "variante", "producto", "categoria");
  const categoria = (await post("/api/catalogo/categorias", { nombre: "Almacén" })).body.data;
  const producto = (await post("/api/catalogo/productos", {
    categoria_id: categoria.id,
    nombre: "Yerba",
    variantes: [{ nombre: "500 g", sku: "YER-500", precio: 1000 }, { nombre: "1 kg", sku: "YER-1K", precio: 1800 }],
  })).body.data;
  [yerba] = producto.variantes;
  azucar = (await post("/api/catalogo/productos", { categoria_id: categoria.id, nombre: "Azúcar", variantes: [{ sku: "AZU", precio: 900 }] })).body.data.variantes[0];
});

describe("Ingreso de mercadería", () => {
  it("activa el control, suma stock y deja el movimiento con remito, costo y usuario", async () => {
    const res = await post("/api/stock/ingresos", {
      items: [{ variante_id: yerba.id, cantidad: 24, costo_unitario: "650,50" }, { variante_id: azucar.id, cantidad: 10 }],
      referencia: "R-0001-00012345",
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ movimientos: 2, unidades: 34 });

    const hist = await get(`/api/stock/variantes/${yerba.id}/movimientos`);
    expect(hist.body.existencia).toMatchObject({ controla_stock: true, cantidad: 24, disponible: 24, estado: "ok" });
    expect(hist.body.data[0]).toMatchObject({ tipo: "ingreso", cantidad: 24, saldo_cantidad: 24, costo_unitario: "650.50", referencia_id: "R-0001-00012345" });
    expect(hist.body.data[0].usuario.id).toBe(staff.id);
  });

  it("rechaza presentaciones repetidas en el mismo ingreso y cantidades inválidas", async () => {
    const repetida = await post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 1 }, { variante_id: yerba.id, cantidad: 2 }] });
    expect(repetida.status).toBe(400);
    expect(repetida.body.detalles[0].mensaje).toMatch(/repetida/);
    const cero = await post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 0 }] });
    expect(cero.body.detalles[0].mensaje).toBe("La cantidad tiene que ser mayor a 0");
  });
});

describe("Ajustes", () => {
  beforeEach(() => post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 10 }] }));

  it("resta con motivo obligatorio y no deja el stock negativo", async () => {
    const sinMotivo = await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "restar", cantidad: 2 });
    expect(sinMotivo.status).toBe(400);

    expect((await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "restar", cantidad: 2, motivo: "Rotura" })).body.data).toEqual({ diferencia: -2, saldo_cantidad: 8 });

    const demasiado = await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "restar", cantidad: 9, motivo: "Rotura" });
    expect(demasiado.status).toBe(409);
    expect(demasiado.body.mensaje).toBe("No hay stock suficiente de Yerba (500 g): hay 8 disponible(s).");
  });

  it("fijar por conteo registra solo la diferencia", async () => {
    const res = await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 7, motivo: "Conteo de inventario" });
    expect(res.body.data).toEqual({ diferencia: -3, saldo_cantidad: 7 });
    const igual = await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 7, motivo: "Conteo de inventario" });
    expect(igual.body.codigo).toBe("SIN_DIFERENCIA");
  });

  it("una presentación que no controla stock no acepta ajustes", async () => {
    const res = await post("/api/stock/ajustes", { variante_id: azucar.id, modo: "sumar", cantidad: 5, motivo: "Prueba" });
    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe("STOCK_NO_CONTROLADO");
  });
});

describe("Reglas del saldo", () => {
  beforeEach(() => post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 5 }] }));

  it("sin sobreventa: 5 ventas simultáneas por la última unidad, solo una sale", async () => {
    await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 1, motivo: "Conteo" });
    const intentos = await Promise.allSettled(
      Array.from({ length: 5 }, () => enTransaccion({ variante_id: yerba.id, tipo: "venta", cantidad: -1, referencia_tipo: "prueba" })),
    );
    expect(intentos.filter((i) => i.status === "fulfilled")).toHaveLength(1);
    expect(intentos.filter((i) => i.status === "rejected").every((i) => i.reason.codigo === "STOCK_INSUFICIENTE")).toBe(true);
    expect(await existencia(yerba)).toMatchObject({ cantidad: 0, disponible: 0, estado: "sin_stock" });
  });

  it("lo reservado no está disponible: no se puede vender ni ajustar por debajo", async () => {
    await enTransaccion({ variante_id: yerba.id, tipo: "reserva", reservado: 3, referencia_tipo: "pedido", referencia_id: 1 });
    expect(await existencia(yerba)).toMatchObject({ cantidad: 5, reservado: 3, disponible: 2 });

    await expect(enTransaccion({ variante_id: yerba.id, tipo: "venta", cantidad: -3 })).rejects.toMatchObject({ codigo: "STOCK_INSUFICIENTE" });
    const ajuste = await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "restar", cantidad: 3, motivo: "Rotura" });
    expect(ajuste.status).toBe(409);

    // Vender lo reservado baja las dos cosas a la vez
    await enTransaccion({ variante_id: yerba.id, tipo: "venta", cantidad: -3, reservado: -3, referencia_tipo: "pedido", referencia_id: 1 });
    expect(await existencia(yerba)).toMatchObject({ cantidad: 2, reservado: 0, disponible: 2 });
  });

  it("no deja de controlar stock con reservas pendientes", async () => {
    await enTransaccion({ variante_id: yerba.id, tipo: "reserva", reservado: 1 });
    const res = await request(app).patch(`/api/stock/variantes/${yerba.id}`).set(...autorizacion(staff)).send({ controla_stock: false });
    expect(res.body.codigo).toBe("STOCK_CON_RESERVAS");
  });

  it("el historial no se puede modificar ni borrar (lo impide la base)", async () => {
    await expect(sequelize.query(`UPDATE ${DB_SCHEMA}.movimiento_stock SET cantidad = 999`)).rejects.toThrow(/no se pueden modificar ni borrar/);
    await expect(sequelize.query(`DELETE FROM ${DB_SCHEMA}.movimiento_stock`)).rejects.toThrow(/no se pueden modificar ni borrar/);
  });

  it("varios movimientos en una transacción: si uno falla, no se aplica ninguno", async () => {
    await post("/api/stock/ingresos", { items: [{ variante_id: azucar.id, cantidad: 1 }] });
    await expect(
      sequelize.transaction((transaction) =>
        registrarMovimientos(
          [
            { variante_id: azucar.id, tipo: "venta", cantidad: -1 },
            { variante_id: yerba.id, tipo: "venta", cantidad: -50 },
          ],
          { transaction },
        ),
      ),
    ).rejects.toMatchObject({ codigo: "STOCK_INSUFICIENTE" });
    expect((await existencia(azucar)).cantidad).toBe(1);
  });

  it("la conciliación confirma que la suma de movimientos da el saldo", async () => {
    await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "sumar", cantidad: 4, motivo: "Conteo" });
    await enTransaccion({ variante_id: yerba.id, tipo: "reserva", reservado: 2 });
    await enTransaccion({ variante_id: yerba.id, tipo: "liberacion", reservado: -1 });
    expect((await get("/api/stock/conciliacion")).body.data).toEqual({ correcto: true, diferencias: [] });
  });
});

describe("Existencias y permisos", () => {
  beforeEach(async () => {
    await post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 3 }] });
    await request(app).patch(`/api/stock/variantes/${yerba.id}`).set(...autorizacion(staff)).send({ minimo: 5 });
  });

  it("lista con estado y filtra por bajo mínimo, sin control y búsqueda", async () => {
    const todas = await get("/api/stock/existencias");
    expect(todas.body.paginacion.total).toBe(3);
    const nombres = (res) => res.body.data.map((f) => `${f.producto} ${f.presentacion ?? ""}`.trim());

    const bajo = await get("/api/stock/existencias?estado=bajo");
    expect(bajo.body.data).toEqual([expect.objectContaining({ sku: "YER-500", disponible: 3, minimo: 5, estado: "bajo" })]);
    expect(nombres(await get("/api/stock/existencias?estado=sin_control"))).toEqual(["Azúcar", "Yerba 1 kg"]);
    expect(nombres(await get("/api/stock/existencias?q=yer-1k"))).toEqual(["Yerba 1 kg"]);
  });

  it("el resumen cuenta sin stock y stock bajo", async () => {
    await request(app).patch(`/api/stock/variantes/${azucar.id}`).set(...autorizacion(staff)).send({ controla_stock: true });
    expect((await get("/api/stock/resumen")).body.data).toEqual({ controladas: 2, sin_stock: 1, bajo: 1 });
  });

  it("solo el panel (admin/staff) accede", async () => {
    expect((await get("/api/stock/existencias", cliente)).status).toBe(403);
    expect((await request(app).get("/api/stock/existencias")).status).toBe(401);
  });
});

describe("Disponibilidad en la tienda", () => {
  const publico = async () => (await request(app).get("/api/catalogo/productos/yerba")).body.data.variantes;

  it("informa disponible / últimas unidades / sin stock sin mostrar cantidades", async () => {
    await post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 10 }] });
    await request(app).patch(`/api/stock/variantes/${yerba.id}`).set(...autorizacion(staff)).send({ minimo: 3 });

    const inicial = await publico();
    let chica = inicial[0];
    expect(chica.disponibilidad).toBe("disponible");
    expect(inicial[1].disponibilidad).toBe("disponible"); // sin control de stock: siempre disponible
    expect(chica).not.toHaveProperty("cantidad_disponible");
    expect(chica).not.toHaveProperty("stock");

    await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 2, motivo: "Conteo" });
    [chica] = await publico();
    expect(chica.disponibilidad).toBe("ultimas");

    await post("/api/stock/ajustes", { variante_id: yerba.id, modo: "fijar", cantidad: 0, motivo: "Conteo" });
    [chica] = await publico();
    expect(chica.disponibilidad).toBe("sin_stock");
  });

  it("el panel sí ve la cantidad disponible", async () => {
    await post("/api/stock/ingresos", { items: [{ variante_id: yerba.id, cantidad: 4 }] });
    const res = await get("/api/catalogo/productos/yerba");
    expect(res.body.data.variantes[0]).toMatchObject({ disponibilidad: "disponible", cantidad_disponible: 4 });
  });
});
