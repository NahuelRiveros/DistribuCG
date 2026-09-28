import { Op } from "sequelize";
import { slugDisponible, slugificar } from "compartido/reglas/slug.js";

/** Slug único entre los registros no eliminados del modelo (agrega -2, -3... si hace falta). */
export async function generarSlugUnico(Modelo, texto, { excluirId = null, largo = 80, transaction } = {}) {
  const base = slugificar(texto, largo);
  const where = { slug: { [Op.startsWith]: base }, eliminado_en: null };
  if (excluirId) where.id = { [Op.ne]: excluirId };
  const usados = await Modelo.findAll({ where, attributes: ["slug"], raw: true, transaction });
  return slugDisponible(base, usados.map((u) => u.slug));
}
