import { Op, QueryTypes } from "sequelize";
import { proyecto } from "compartido/proyecto.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../nucleo/errores.js";
import { Categoria, Producto } from "./modelos.js";
import { generarSlugUnico } from "./slugs.js";

const ATRIBUTOS = ["id", "nombre", "slug", "padre_id", "orden", "en_menu"];

/**
 * Lista plana (el frontend arma el árbol con padre_id). `cantidad_productos` cuenta
 * solo los productos directos de cada categoría; el público solo cuenta los visibles.
 */
export async function listarCategorias({ soloVisibles = false } = {}) {
  const [categorias, conteos] = await Promise.all([
    Categoria.findAll({ where: { eliminado_en: null }, attributes: ATRIBUTOS, order: [["orden", "ASC"], ["nombre", "ASC"]], raw: true }),
    Producto.findAll({
      attributes: ["categoria_id", [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"]],
      where: { eliminado_en: null, ...(soloVisibles ? { activo: true, publicado: true } : {}) },
      group: ["categoria_id"],
      raw: true,
    }),
  ]);
  const porCategoria = new Map(conteos.map((c) => [c.categoria_id, Number(c.cantidad)]));
  return categorias.map((c) => ({ ...c, cantidad_productos: porCategoria.get(c.id) ?? 0 }));
}

/** La categoría y todas sus subcategorías (cualquier profundidad), en una sola consulta. */
export async function idsConDescendientes(categoriaId, { transaction } = {}) {
  const filas = await sequelize.query(
    `WITH RECURSIVE arbol AS (
       SELECT id FROM ${DB_SCHEMA}.categoria WHERE id = :id AND eliminado_en IS NULL
       UNION ALL
       SELECT c.id FROM ${DB_SCHEMA}.categoria c JOIN arbol a ON c.padre_id = a.id WHERE c.eliminado_en IS NULL
     ) SELECT id FROM arbol`,
    { replacements: { id: categoriaId }, type: QueryTypes.SELECT, transaction },
  );
  return filas.map((f) => f.id);
}

async function ancestros(categoriaId, transaction) {
  const filas = await sequelize.query(
    `WITH RECURSIVE cadena AS (
       SELECT id, padre_id FROM ${DB_SCHEMA}.categoria WHERE id = :id
       UNION ALL
       SELECT c.id, c.padre_id FROM ${DB_SCHEMA}.categoria c JOIN cadena h ON c.id = h.padre_id
     ) SELECT id FROM cadena`,
    { replacements: { id: categoriaId }, type: QueryTypes.SELECT, transaction },
  );
  return filas.map((f) => f.id);
}

async function alturaSubarbol(categoriaId, transaction) {
  const [fila] = await sequelize.query(
    `WITH RECURSIVE arbol AS (
       SELECT id, 1 AS nivel FROM ${DB_SCHEMA}.categoria WHERE id = :id
       UNION ALL
       SELECT c.id, a.nivel + 1 FROM ${DB_SCHEMA}.categoria c JOIN arbol a ON c.padre_id = a.id WHERE c.eliminado_en IS NULL
     ) SELECT MAX(nivel) AS altura FROM arbol`,
    { replacements: { id: categoriaId }, type: QueryTypes.SELECT, transaction },
  );
  return Number(fila?.altura ?? 1);
}

export async function buscarCategoriaActiva(id, { transaction } = {}) {
  const categoria = await Categoria.findOne({ where: { id, eliminado_en: null }, transaction });
  if (!categoria) throw new NoEncontrado("La categoría no existe.", "CATEGORIA_NO_ENCONTRADA");
  return categoria;
}

async function validarUbicacion({ padre_id, idPropio = null, transaction }) {
  if (padre_id == null) return;
  const padre = await Categoria.findOne({ where: { id: padre_id, eliminado_en: null }, transaction });
  if (!padre) throw new DatosInvalidos("Revisá los datos ingresados.", [{ campo: "padre_id", mensaje: "La categoría padre no existe" }]);

  const cadena = await ancestros(padre_id, transaction);
  if (idPropio && cadena.includes(idPropio)) {
    throw new DatosInvalidos("Revisá los datos ingresados.", [
      { campo: "padre_id", mensaje: "Una categoría no puede quedar dentro de sí misma ni de una subcategoría suya" },
    ]);
  }
  const altura = idPropio ? await alturaSubarbol(idPropio, transaction) : 1;
  const maximo = proyecto.catalogo.max_niveles_categoria;
  if (cadena.length + altura > maximo) {
    throw new DatosInvalidos("Revisá los datos ingresados.", [{ campo: "padre_id", mensaje: `Se admiten hasta ${maximo} niveles de categorías` }]);
  }
}

async function validarNombreLibre({ nombre, padre_id, idPropio = null, transaction }) {
  const where = {
    eliminado_en: null,
    padre_id: padre_id ?? null,
    [Op.and]: sequelize.where(sequelize.fn("lower", sequelize.col("nombre")), nombre.toLowerCase()),
  };
  if (idPropio) where.id = { [Op.ne]: idPropio };
  if (await Categoria.findOne({ where, attributes: ["id"], transaction })) {
    throw new Conflicto(`Ya existe la categoría "${nombre}" en ese nivel.`, "CATEGORIA_DUPLICADA");
  }
}

export async function crearCategoria({ nombre, padre_id, orden, en_menu }) {
  return sequelize.transaction(async (transaction) => {
    await validarUbicacion({ padre_id, transaction });
    await validarNombreLibre({ nombre, padre_id, transaction });
    const slug = await generarSlugUnico(Categoria, nombre, { largo: 90, transaction });
    const categoria = await Categoria.create({ nombre, padre_id, orden, en_menu, slug }, { transaction });
    return categoria.get({ plain: true });
  });
}

export async function actualizarCategoria(id, { nombre, padre_id, orden, en_menu }) {
  return sequelize.transaction(async (transaction) => {
    const categoria = await buscarCategoriaActiva(id, { transaction });
    await validarUbicacion({ padre_id, idPropio: categoria.id, transaction });
    await validarNombreLibre({ nombre, padre_id, idPropio: categoria.id, transaction });
    const slug = nombre === categoria.nombre ? categoria.slug : await generarSlugUnico(Categoria, nombre, { excluirId: categoria.id, largo: 90, transaction });
    await categoria.update({ nombre, padre_id, orden, en_menu, slug }, { transaction });
    return categoria.get({ plain: true });
  });
}

// Baja lógica. No se permite si le quedan productos o subcategorías: evita dejar
// productos "colgados" de una categoría invisible.
export async function eliminarCategoria(id) {
  return sequelize.transaction(async (transaction) => {
    const categoria = await buscarCategoriaActiva(id, { transaction });
    const productos = await Producto.count({ where: { categoria_id: id, eliminado_en: null }, transaction });
    if (productos > 0) {
      throw new Conflicto(`La categoría tiene ${productos} producto(s). Movelos o eliminalos antes.`, "CATEGORIA_CON_PRODUCTOS");
    }
    const subcategorias = await Categoria.count({ where: { padre_id: id, eliminado_en: null }, transaction });
    if (subcategorias > 0) {
      throw new Conflicto(`La categoría tiene ${subcategorias} subcategoría(s). Eliminalas o movelas antes.`, "CATEGORIA_CON_SUBCATEGORIAS");
    }
    await categoria.update({ eliminado_en: new Date() }, { transaction });
  });
}
