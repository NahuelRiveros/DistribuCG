import { Op } from "sequelize";
import { CategoriaDistribuidora, ProductoDistribuidora } from "../../models/index.js";
import { crearCrudService } from "../common/crud_service.js";

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

export async function listarCategorias() {
  const { items } = await categoriasCrud.listar();
  return items;
}

export async function existeCategoriaConSlug(slug, excluirId = null) {
  const where = { slug, fecha_baja: null };
  if (excluirId) where.id = { [Op.ne]: excluirId };
  return !!(await CategoriaDistribuidora.findOne({ where }));
}

export async function crearCategoria({ nombre, slug, padre_id = null }) {
  return CategoriaDistribuidora.create({ nombre, slug, padre_id, fecha_alta: new Date() });
}

export async function actualizarCategoria(id, { nombre, slug, padre_id = null }) {
  const cat = await CategoriaDistribuidora.findByPk(id);
  if (!cat) return null;
  await cat.update({ nombre, slug, padre_id });
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
