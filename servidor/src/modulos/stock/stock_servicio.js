import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, NoEncontrado } from "../../nucleo/errores.js";
import { armarPaginacion, normalizarPaginacion } from "../../nucleo/paginacion.js";
import { patronContiene } from "../../nucleo/consultas.js";
import { idsConDescendientes } from "../catalogo/categoria_servicio.js";
import { Variante } from "../catalogo/modelos.js";
import { Usuario } from "../usuarios/modelos.js";
import { MovimientoStock, Stock } from "./modelos.js";
import { registrarMovimiento, registrarMovimientos } from "./movimientos.js";

const S = DB_SCHEMA;

/** "ok" | "bajo" | "sin_stock" | "sin_control" */
export function estadoStock({ controla_stock, disponible, minimo }) {
  if (!controla_stock) return "sin_control";
  if (disponible <= 0) return "sin_stock";
  if (disponible <= minimo) return "bajo";
  return "ok";
}

// Condiciones SQL fijas (sin datos del usuario) para cada filtro de estado.
const FILTRO_ESTADO = {
  todos: "",
  controlados: "AND v.controla_stock",
  sin_control: "AND NOT v.controla_stock",
  sin_stock: "AND v.controla_stock AND COALESCE(s.cantidad - s.reservado, 0) <= 0",
  bajo: "AND v.controla_stock AND COALESCE(s.cantidad - s.reservado, 0) > 0 AND COALESCE(s.cantidad - s.reservado, 0) <= COALESCE(s.minimo, 0)",
};

const DESDE = `FROM ${S}.variante v
  JOIN ${S}.producto p ON p.id = v.producto_id
  JOIN ${S}.categoria c ON c.id = p.categoria_id
  LEFT JOIN ${S}.stock s ON s.variante_id = v.id
  WHERE v.eliminado_en IS NULL AND p.eliminado_en IS NULL`;

export async function listarExistencias({ q, categoria, estado = "todos", pagina, limite }) {
  const pag = normalizarPaginacion({ pagina, limite, limitePorDefecto: 30 });
  const replacements = { limite: pag.limite, offset: pag.offset };
  let filtros = FILTRO_ESTADO[estado] ?? "";
  if (q) {
    filtros += " AND (p.nombre ILIKE :patron OR v.nombre ILIKE :patron OR v.sku ILIKE :patron OR p.marca ILIKE :patron)";
    replacements.patron = patronContiene(q);
  }
  if (categoria) {
    filtros += " AND p.categoria_id IN (:categorias)";
    replacements.categorias = await idsConDescendientes(categoria);
  }

  const filas = await sequelize.query(
    `SELECT v.id AS variante_id, p.id AS producto_id, p.nombre AS producto, v.nombre AS presentacion, v.sku,
            c.nombre AS categoria, v.controla_stock,
            COALESCE(s.cantidad, 0) AS cantidad, COALESCE(s.reservado, 0) AS reservado, COALESCE(s.minimo, 0) AS minimo,
            COUNT(*) OVER() AS total
     ${DESDE} ${filtros}
     ORDER BY p.nombre, v.orden, v.id
     LIMIT :limite OFFSET :offset`,
    { replacements, type: QueryTypes.SELECT },
  );
  const total = Number(filas[0]?.total ?? 0);
  const data = filas.map(({ total: _total, ...f }) => {
    const disponible = f.cantidad - f.reservado;
    return { ...f, disponible, estado: estadoStock({ ...f, disponible }) };
  });
  return { data, paginacion: armarPaginacion({ ...pag, total }) };
}

export async function resumenStock() {
  const [fila] = await sequelize.query(
    `SELECT COUNT(*) FILTER (WHERE v.controla_stock)::int AS controladas,
            COUNT(*) FILTER (WHERE v.controla_stock AND COALESCE(s.cantidad - s.reservado, 0) <= 0)::int AS sin_stock,
            COUNT(*) FILTER (WHERE v.controla_stock AND COALESCE(s.cantidad - s.reservado, 0) > 0
                               AND COALESCE(s.cantidad - s.reservado, 0) <= COALESCE(s.minimo, 0))::int AS bajo
     ${DESDE}`,
    { type: QueryTypes.SELECT },
  );
  return fila;
}

async function varianteActiva(variante_id, transaction) {
  const variante = await Variante.findOne({ where: { id: variante_id, eliminado_en: null }, transaction, lock: transaction?.LOCK.UPDATE });
  if (!variante) throw new NoEncontrado("La presentación no existe.", "PRESENTACION_NO_ENCONTRADA");
  return variante;
}

/** Activa o desactiva el control de stock de una presentación y/o su mínimo. */
export async function configurarStock(variante_id, { controla_stock, minimo }) {
  await sequelize.transaction(async (transaction) => {
    const variante = await varianteActiva(variante_id, transaction);
    const [stock] = await Stock.findOrCreate({ where: { variante_id }, defaults: { variante_id }, transaction });
    if (controla_stock === false && stock.reservado > 0) {
      throw new Conflicto(`Hay ${stock.reservado} unidad(es) reservadas para pedidos. Resolvé esos pedidos antes de dejar de controlar el stock.`, "STOCK_CON_RESERVAS");
    }
    if (controla_stock !== undefined) await variante.update({ controla_stock }, { transaction });
    if (minimo !== undefined) await stock.update({ minimo }, { transaction });
  });
  return obtenerExistencia(variante_id);
}

export async function obtenerExistencia(variante_id) {
  const [fila] = await sequelize.query(
    `SELECT v.id AS variante_id, p.nombre AS producto, v.nombre AS presentacion, v.sku, v.controla_stock,
            COALESCE(s.cantidad, 0) AS cantidad, COALESCE(s.reservado, 0) AS reservado, COALESCE(s.minimo, 0) AS minimo
     ${DESDE} AND v.id = :variante_id`,
    { replacements: { variante_id }, type: QueryTypes.SELECT },
  );
  if (!fila) throw new NoEncontrado("La presentación no existe.", "PRESENTACION_NO_ENCONTRADA");
  const disponible = fila.cantidad - fila.reservado;
  return { ...fila, disponible, estado: estadoStock({ ...fila, disponible }) };
}

/**
 * Ingreso de mercadería (varias presentaciones, un remito). Si una presentación
 * todavía no controlaba stock, se activa: recibir mercadería es empezar a contarla.
 */
export async function ingresarMercaderia({ items, referencia, motivo }, usuario_id) {
  return sequelize.transaction(async (transaction) => {
    for (const { variante_id } of [...items].sort((a, b) => a.variante_id - b.variante_id)) {
      const variante = await varianteActiva(variante_id, transaction);
      if (!variante.controla_stock) await variante.update({ controla_stock: true }, { transaction });
    }
    const movimientos = await registrarMovimientos(
      items.map((i) => ({
        variante_id: i.variante_id,
        tipo: "ingreso",
        cantidad: i.cantidad,
        costo_unitario: i.costo_unitario ?? null,
        motivo: motivo ?? null,
        referencia_tipo: referencia ? "remito" : null,
        referencia_id: referencia ?? null,
        usuario_id,
      })),
      { transaction },
    );
    return { movimientos: movimientos.length, unidades: items.reduce((s, i) => s + i.cantidad, 0) };
  });
}

/** Ajuste manual: sumar/restar una diferencia, o fijar la cantidad que dio un conteo. */
export async function ajustarStock({ variante_id, modo, cantidad, motivo }, usuario_id) {
  return sequelize.transaction(async (transaction) => {
    let diferencia = modo === "restar" ? -cantidad : cantidad;
    if (modo === "fijar") {
      // Bloquea el saldo para que el conteo no se mezcle con otra operación simultánea.
      const actual = await Stock.findOne({ where: { variante_id }, transaction, lock: transaction.LOCK.UPDATE });
      diferencia = cantidad - (actual?.cantidad ?? 0);
      if (diferencia === 0) throw new Conflicto("La cantidad contada es igual a la registrada: no hay nada que ajustar.", "SIN_DIFERENCIA");
    }
    if (diferencia === 0) throw new Conflicto("La cantidad a ajustar tiene que ser mayor a 0.", "SIN_DIFERENCIA");
    const movimiento = await registrarMovimiento({ variante_id, tipo: "ajuste", cantidad: diferencia, motivo, usuario_id }, { transaction });
    return { diferencia, saldo_cantidad: movimiento.saldo_cantidad };
  });
}

export async function historial(variante_id, { pagina, limite }) {
  const existencia = await obtenerExistencia(variante_id);
  const pag = normalizarPaginacion({ pagina, limite, limitePorDefecto: 25 });
  const { rows, count } = await MovimientoStock.findAndCountAll({
    where: { variante_id },
    include: [{ model: Usuario, as: "usuario", attributes: ["id", "nombre", "apellido"] }],
    order: [["id", "DESC"]],
    limit: pag.limite,
    offset: pag.offset,
  });
  return { existencia, data: rows.map((r) => r.get({ plain: true })), paginacion: armarPaginacion({ ...pag, total: count }) };
}

/**
 * Chequeo de integridad: la suma de los movimientos de cada presentación tiene que
 * dar su saldo. Devuelve las diferencias (lista vacía = todo coincide).
 */
export async function conciliar() {
  return sequelize.query(
    `SELECT s.variante_id, s.cantidad, s.reservado,
            COALESCE(SUM(m.cantidad), 0)::int AS suma_cantidad, COALESCE(SUM(m.reservado), 0)::int AS suma_reservado
     FROM ${S}.stock s LEFT JOIN ${S}.movimiento_stock m ON m.variante_id = s.variante_id
     GROUP BY s.variante_id, s.cantidad, s.reservado
     HAVING s.cantidad <> COALESCE(SUM(m.cantidad), 0) OR s.reservado <> COALESCE(SUM(m.reservado), 0)`,
    { type: QueryTypes.SELECT },
  );
}
