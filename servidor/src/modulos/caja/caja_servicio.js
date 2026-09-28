import { Op, fn, col, where as condicion } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../nucleo/errores.js";
import { CajaCategoria, CajaMovimiento } from "./modelos.js";

// Alta, edición y anulación de movimientos de caja, y ABM de sus categorías.
// Un movimiento nunca se borra: se anula con motivo y queda quién y cuándo.

const TIPO = { ingreso: "ingresos", egreso: "egresos" };

async function verMovimiento(id, transaction) {
  const m = await CajaMovimiento.findByPk(id, {
    include: [{ model: CajaCategoria, as: "categoria", attributes: ["id", "nombre"] }],
    transaction,
  });
  if (!m) throw new NoEncontrado("El movimiento no existe.", "MOVIMIENTO_NO_ENCONTRADO");
  return m.get({ plain: true });
}

/** La categoría tiene que ser del mismo tipo y estar activa (salvo que sea la que ya tenía). */
async function exigirCategoria({ categoria_id, tipo, actual = null, transaction }) {
  const categoria = await CajaCategoria.findOne({ where: { id: categoria_id, tipo }, transaction });
  if (!categoria || (!categoria.activa && categoria.id !== actual)) {
    throw new DatosInvalidos("Revisá los datos ingresados.", [{ campo: "categoria_id", mensaje: `Elegí una categoría de ${TIPO[tipo]} activa` }]);
  }
}

export async function crearMovimiento(actor, datos) {
  const id = await sequelize.transaction(async (transaction) => {
    await exigirCategoria({ ...datos, transaction });
    const m = await CajaMovimiento.create({ ...datos, registrado_por: actor.id }, { transaction });
    return m.id;
  });
  return verMovimiento(id);
}

async function movimientoVigente(id, transaction) {
  const m = await CajaMovimiento.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!m) throw new NoEncontrado("El movimiento no existe.", "MOVIMIENTO_NO_ENCONTRADO");
  if (m.anulado_en) throw new Conflicto("El movimiento ya está anulado: no se puede modificar.", "MOVIMIENTO_ANULADO");
  return m;
}

export async function editarMovimiento(actor, id, datos) {
  await sequelize.transaction(async (transaction) => {
    const m = await movimientoVigente(id, transaction);
    await exigirCategoria({ ...datos, actual: m.categoria_id, transaction });
    await m.update({ ...datos, actualizado_por: actor.id }, { transaction });
  });
  return verMovimiento(id);
}

export async function anularMovimiento(actor, id, { motivo }) {
  await sequelize.transaction(async (transaction) => {
    const m = await movimientoVigente(id, transaction);
    await m.update({ anulado_en: new Date(), anulado_por: actor.id, motivo_anulacion: motivo }, { transaction });
  });
  return verMovimiento(id);
}

// ── Categorías ─────────────────────────────────────────────────────────────

export async function listarCategorias() {
  const categorias = await CajaCategoria.findAll({
    attributes: {
      include: [[sequelize.literal(`(SELECT COUNT(*) FROM ${DB_SCHEMA}.caja_movimiento m WHERE m.categoria_id = "caja_categoria"."id")`), "movimientos"]],
    },
    order: [["tipo", "ASC"], ["orden", "ASC"], ["nombre", "ASC"]],
  });
  return categorias.map((c) => ({ ...c.get({ plain: true }), movimientos: Number(c.get("movimientos")) }));
}

async function exigirNombreLibre({ tipo, nombre, excepto_id = null, transaction }) {
  const where = { tipo, [Op.and]: [condicion(fn("lower", col("nombre")), nombre.toLowerCase())] };
  if (excepto_id) where.id = { [Op.ne]: excepto_id };
  if (await CajaCategoria.findOne({ where, attributes: ["id"], transaction })) {
    throw new Conflicto(`Ya hay una categoría de ${TIPO[tipo]} con ese nombre.`, "CATEGORIA_REPETIDA");
  }
}

export async function crearCategoria({ tipo, nombre }) {
  return sequelize.transaction(async (transaction) => {
    await exigirNombreLibre({ tipo, nombre, transaction });
    const ultimo = (await CajaCategoria.max("orden", { where: { tipo }, transaction })) ?? 0;
    const categoria = await CajaCategoria.create({ tipo, nombre, orden: ultimo + 1 }, { transaction });
    return { ...categoria.get({ plain: true }), movimientos: 0 };
  });
}

/** Renombrar, ordenar o activar/desactivar. Desactivada no se ofrece al cargar, pero sus movimientos siguen sumando. */
export async function editarCategoria(id, cambios) {
  await sequelize.transaction(async (transaction) => {
    const categoria = await CajaCategoria.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!categoria) throw new NoEncontrado("La categoría no existe.", "CATEGORIA_NO_ENCONTRADA");
    if (cambios.nombre) await exigirNombreLibre({ tipo: categoria.tipo, nombre: cambios.nombre, excepto_id: categoria.id, transaction });
    await categoria.update(cambios, { transaction });
  });
  return (await listarCategorias()).find((c) => c.id === id);
}
