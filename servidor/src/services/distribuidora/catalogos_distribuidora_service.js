import { Op } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { CategoriaDistribuidora, ProductoDistribuidora } from "../../models/index.js";
import { crearCrudService } from "../common/crud_service.js";
import { capitalizar } from "../common/query_helpers.js";

/**
 * Catálogo de categorías de distribuidora (jerárquicas). Mismo patrón que
 * services/productos/catalogos_service.js (indumentaria) — baja lógica por
 * `fecha_baja`, no el `activo` booleano genérico de crearCrudService.
 */

const categoriasCrud = crearCrudService(CategoriaDistribuidora, {
  defaultOrder: [["nombre", "ASC"]],
  defaultAttributes: ["id", "nombre", "slug", "padre_id"],
  softDeleteField: "fecha_baja",
});

// `cantidad_productos` viaja con cada categoría para que el árbol del admin
// pueda decidir "esto tiene contenido / es hoja / hace falta cargar sus
// productos" SIN tener que traer los productos en sí — clave para que el
// árbol cargue productos recién al expandir una categoría (carga perezosa,
// pensado para catálogos de miles de productos).
export async function listarCategorias() {
  const [{ items }, conteos] = await Promise.all([
    categoriasCrud.listar(),
    ProductoDistribuidora.findAll({
      attributes: ["categoria_id", [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"]],
      where: { fecha_baja: null },
      group: ["categoria_id"],
      raw: true,
    }),
  ]);
  const mapaConteos = new Map(conteos.map((c) => [c.categoria_id, Number(c.cantidad)]));
  return items.map((cat) => ({ ...cat.get({ plain: true }), cantidad_productos: mapaConteos.get(cat.id) ?? 0 }));
}

export async function existeCategoriaConSlug(slug, excluirId = null) {
  const where = { slug, fecha_baja: null };
  if (excluirId) where.id = { [Op.ne]: excluirId };
  return !!(await CategoriaDistribuidora.findOne({ where }));
}

export async function crearCategoria({ nombre, slug, padre_id = null }) {
  return CategoriaDistribuidora.create({ nombre: capitalizar(nombre), slug, padre_id, fecha_alta: new Date() });
}

export async function actualizarCategoria(id, { nombre, slug, padre_id = null }) {
  const cat = await CategoriaDistribuidora.findByPk(id);
  if (!cat) return null;
  await cat.update({ nombre: capitalizar(nombre), slug, padre_id });
  return cat;
}

// Eliminación definitiva — bloqueada si hay productos usándola, promueve
// subcategorías a raíz en vez de arrastrarlas (igual criterio que Categoria).
export async function eliminarCategoria(id) {
  const cat = await CategoriaDistribuidora.findByPk(id);
  if (!cat) return { ok: false, motivo: "no_encontrada" };

  const tieneProductos = await ProductoDistribuidora.count({ where: { categoria_id: id } });
  if (tieneProductos > 0) {
    return { ok: false, motivo: "en_uso", cantidad: tieneProductos };
  }

  await CategoriaDistribuidora.update({ padre_id: null }, { where: { padre_id: id } });
  await cat.destroy();
  return { ok: true };
}
