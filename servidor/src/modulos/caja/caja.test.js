import ExcelJS from "exceljs";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hoyEn } from "compartido/reglas/fechas.js";
import { crearApp } from "../../app.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Pedido, PedidoCobro } from "../tienda/modelos.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";
import { CajaCategoria } from "./modelos.js";

const app = crearApp();
let admin, staff, cat;

const como = (usuario) => ({
  get: (url) => request(app).get(url).set(...autorizacion(usuario)),
  post: (url, body) => request(app).post(url).set(...autorizacion(usuario)).send(body),
  patch: (url, body) => request(app).patch(url).set(...autorizacion(usuario)).send(body),
});

beforeEach(async () => {
  await vaciarTablas("caja_movimiento", "pedido_cobro", "pedido", "usuario_rol", "usuario", "rol");
  await crearRoles();
  admin = await crearUsuario({ email: "admin@test.com", roles: ["admin"] });
  staff = await crearUsuario({ email: "staff@test.com", roles: ["staff"] });
  // Categorías iniciales de la migración (por nombre, para no depender de los ids)
  cat = Object.fromEntries((await CajaCategoria.findAll()).map((c) => [c.nombre, c.id]));
});
afterAll(() => sequelize.close());

const movimiento = (extra) => ({ tipo: "egreso", fecha: "2025-03-10", monto: "1000", categoria_id: cat.Sueldos, medio: "efectivo", ...extra });

/** Cobro de un pedido registrado en un momento exacto (UTC). */
async function cobroDePedido({ monto, cuando, anulado = false }) {
  const pedido = await Pedido.create({ usuario_id: admin.id, estado: "pendiente", modalidad_entrega: "retiro", entrega: {}, subtotal_neto: monto, total_iva: 0, total: monto });
  const cobro = await PedidoCobro.create({ pedido_id: pedido.id, monto, metodo: "transferencia", registrado_por: admin.id });
  await sequelize.query(`UPDATE ${DB_SCHEMA}.pedido_cobro SET creado_en = :cuando, anulado_en = :anulado, anulado_por = :por WHERE id = :id`, {
    replacements: { cuando, anulado: anulado ? cuando : null, por: anulado ? admin.id : null, id: cobro.id },
  });
  return pedido;
}

describe("acceso a /api/caja", () => {
  it("solo admin: sin sesión 401, personal 403", async () => {
    expect((await request(app).get("/api/caja/anual")).status).toBe(401);
    expect((await como(staff).get("/api/caja/anual")).status).toBe(403);
    expect((await como(admin).get("/api/caja/anual")).status).toBe(200);
  });
});

describe("movimientos", () => {
  it("registra ingresos y egresos y el balance los suma sin errores de redondeo", async () => {
    await como(admin).post("/api/caja/movimientos", movimiento({ tipo: "ingreso", categoria_id: cat["Venta en local"], monto: "0,10", fecha: "2025-03-01" }));
    await como(admin).post("/api/caja/movimientos", movimiento({ tipo: "ingreso", categoria_id: cat["Venta en local"], monto: "0.20", fecha: "2025-03-01" }));
    const alta = await como(admin).post("/api/caja/movimientos", movimiento({ monto: "0.05", fecha: "2025-03-02", descripcion: "Propina" }));
    expect(alta.status).toBe(201);
    expect(alta.body.data).toMatchObject({ tipo: "egreso", monto: "0.05", registrado_por: admin.id, categoria: { nombre: "Sueldos" } });

    const mes = await como(admin).get("/api/caja/mes?anio=2025&mes=3");
    expect(mes.body.data.totales).toEqual({ ingresos: 0.3, egresos: 0.05, saldo: 0.25 });
    expect(mes.body.data.dias).toHaveLength(31);
    expect(mes.body.data.dias[0]).toMatchObject({ fecha: "2025-03-01", ingresos: 0.3, egresos: 0, cantidad: 2 });

    const anual = await como(admin).get("/api/caja/anual?anio=2025");
    expect(anual.body.data.meses[2]).toEqual({ mes: 3, ingresos: 0.3, egresos: 0.05, saldo: 0.25 });
    expect(anual.body.data.totales.saldo).toBe(0.25);
    expect(anual.body.data.anios).toContain(2025);
  });

  it("no acepta una categoría del otro tipo, una desactivada ni una fecha futura", async () => {
    const otroTipo = await como(admin).post("/api/caja/movimientos", movimiento({ categoria_id: cat["Venta en local"] }));
    expect(otroTipo.status).toBe(400);
    expect(otroTipo.body.detalles).toEqual([{ campo: "categoria_id", mensaje: "Elegí una categoría de egresos activa" }]);

    await como(admin).patch(`/api/caja/categorias/${cat.Alquiler}`, { activa: false });
    expect((await como(admin).post("/api/caja/movimientos", movimiento({ categoria_id: cat.Alquiler }))).status).toBe(400);

    const futuro = await como(admin).post("/api/caja/movimientos", movimiento({ fecha: "2099-01-01" }));
    expect(futuro.status).toBe(400);
    expect(futuro.body.detalles[0]).toMatchObject({ campo: "fecha" });

    expect((await como(admin).post("/api/caja/movimientos", movimiento({ fecha: hoyEn() }))).status).toBe(201);
  });

  it("se edita, y al anularlo deja de sumar pero sigue en el listado con su motivo", async () => {
    const { body } = await como(admin).post("/api/caja/movimientos", movimiento());
    const id = body.data.id;

    const editado = await como(admin).patch(`/api/caja/movimientos/${id}`, movimiento({ monto: "1500" }));
    expect(editado.body.data).toMatchObject({ monto: "1500.00", actualizado_por: admin.id });

    const anulado = await como(admin).post(`/api/caja/movimientos/${id}/anular`, { motivo: "Cargado dos veces" });
    expect(anulado.body.data).toMatchObject({ anulado_por: admin.id, motivo_anulacion: "Cargado dos veces" });

    expect((await como(admin).get("/api/caja/anual?anio=2025")).body.data.totales.egresos).toBe(0);
    const lista = await como(admin).get("/api/caja/movimientos?desde=2025-03-01&hasta=2025-03-31");
    expect(lista.body.data).toEqual([expect.objectContaining({ id: String(id), anulado: true, motivo_anulacion: "Cargado dos veces" })]);

    expect((await como(admin).patch(`/api/caja/movimientos/${id}`, movimiento())).status).toBe(409);
    expect((await como(admin).post(`/api/caja/movimientos/${id}/anular`, { motivo: "otra vez" })).body.codigo).toBe("MOVIMIENTO_ANULADO");
  });
});

describe("cobros de pedidos", () => {
  it("entran solos como ingreso, en el día de Argentina, y los anulados no suman", async () => {
    // 02:30 UTC del 1/3 = 23:30 del 28/2 en Argentina
    const pedido = await cobroDePedido({ monto: 2500, cuando: "2025-03-01T02:30:00Z" });
    await cobroDePedido({ monto: 9999, cuando: "2025-02-10T15:00:00Z", anulado: true });

    const febrero = await como(admin).get("/api/caja/mes?anio=2025&mes=2");
    expect(febrero.body.data.totales).toEqual({ ingresos: 2500, egresos: 0, saldo: 2500 });
    expect(febrero.body.data.dias[27]).toMatchObject({ fecha: "2025-02-28", ingresos: 2500 });

    const lista = await como(admin).get("/api/caja/movimientos?origen=tienda&desde=2025-01-01&hasta=2025-12-31");
    expect(lista.body.data).toEqual([
      expect.objectContaining({ origen: "tienda", tipo: "ingreso", fecha: "2025-02-28", monto: 2500, medio: "transferencia", categoria: "Ventas de la tienda", descripcion: `Pedido #${pedido.id}`, pedido_id: pedido.id }),
    ]);

    const anual = await como(admin).get("/api/caja/anual?anio=2025");
    expect(anual.body.data.por_categoria).toEqual([expect.objectContaining({ categoria: "Ventas de la tienda", origen: "tienda", total: 2500 })]);
  });
});

describe("categorías", () => {
  it("crea tipos nuevos de ingreso y egreso, sin repetir nombres, y cuenta sus movimientos", async () => {
    const nueva = await como(admin).post("/api/caja/categorias", { tipo: "egreso", nombre: "Publicidad" });
    expect(nueva.status).toBe(201);
    expect(nueva.body.data).toMatchObject({ tipo: "egreso", nombre: "Publicidad", activa: true, movimientos: 0 });

    const repetida = await como(admin).post("/api/caja/categorias", { tipo: "egreso", nombre: "  publicidad " });
    expect(repetida.status).toBe(409);
    // El mismo nombre en el otro tipo sí se permite
    expect((await como(admin).post("/api/caja/categorias", { tipo: "ingreso", nombre: "Publicidad" })).status).toBe(201);

    await como(admin).post("/api/caja/movimientos", movimiento({ categoria_id: nueva.body.data.id }));
    const lista = await como(admin).get("/api/caja/categorias");
    expect(lista.body.data.find((c) => c.id === nueva.body.data.id).movimientos).toBe(1);

    const renombrada = await como(admin).patch(`/api/caja/categorias/${nueva.body.data.id}`, { nombre: "Publicidad y redes" });
    expect(renombrada.body.data).toMatchObject({ nombre: "Publicidad y redes", movimientos: 1 });
  });
});

describe("exportar a Excel", () => {
  it("genera el año con resumen por mes, por categoría y el detalle", async () => {
    await como(admin).post("/api/caja/movimientos", movimiento({ monto: "1000", fecha: "2025-03-10", descripcion: "Sueldo marzo" }));
    await cobroDePedido({ monto: 3000, cuando: "2025-03-15T15:00:00Z" });

    const res = await como(admin).get("/api/caja/exportar?anio=2025").buffer(true).parse((r, fin) => {
      const partes = [];
      r.on("data", (p) => partes.push(p));
      r.on("end", () => fin(null, Buffer.concat(partes)));
    });
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("caja-2025.xlsx");

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(res.body);
    expect(libro.worksheets.map((h) => h.name)).toEqual(["Resumen 2025", "Por categoría", "Movimientos"]);

    const resumen = libro.getWorksheet("Resumen 2025");
    expect(resumen.getRow(4).values.slice(1)).toEqual(["Marzo", 3000, 1000, 2000]);
    expect(resumen.getRow(14).values.slice(1)).toEqual(["Total del año", 3000, 1000, 2000]);

    const detalle = libro.getWorksheet("Movimientos");
    expect(detalle.rowCount).toBe(3);
    expect(detalle.getRow(2).getCell(3).value).toBe("Sueldos");
    expect(detalle.getRow(2).getCell(6).value).toBe(-1000);
  });
});
