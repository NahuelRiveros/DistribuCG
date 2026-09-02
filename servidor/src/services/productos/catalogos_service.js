import { Op } from "sequelize";
import { Categoria, Marca, Talle, Color, EnvioOpcion, CondicionIva, ProductoTienda } from "../../models/index.js";
import { crearCrudService } from "../common/crud_service.js";

/**
 * Catálogos del módulo eccomerce_indumentaria (categorías, marcas, talles, colores,
 * envío, condición IVA). Todos usan baja lógica por `fecha_baja`, no el
 * campo `activo` booleano de crearCrudService — por eso el soft-delete se
 * escribe acá en vez de reusar cambiarEstado().
 */

async function bajaLogica(Model, id) {
  const item = await Model.findByPk(id);
  if (!item) return null;
  await item.update({ fecha_baja: new Date() });
  return item;
}

// ── Categorías (jerárquicas) ────────────────────────────────────────────────

const categoriasCrud = crearCrudService(Categoria, {
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
  return !!(await Categoria.findOne({ where }));
}

export async function crearCategoria({ nombre, slug, padre_id = null }) {
  return Categoria.create({ nombre, slug, padre_id, fecha_alta: new Date() });
}

export async function actualizarCategoria(id, { nombre, slug, padre_id = null }) {
  const cat = await Categoria.findByPk(id);
  if (!cat) return null;
  await cat.update({ nombre, slug, padre_id });
  return cat;
}

// Eliminación definitiva — bloqueada si hay productos usándola, promueve
// subcategorías a raíz en vez de arrastrarlas.
export async function eliminarCategoria(id) {
  const cat = await Categoria.findByPk(id);
  if (!cat) return { ok: false, motivo: "no_encontrada" };

  const tieneProductos = await ProductoTienda.count({ where: { categoria_id: id } });
  if (tieneProductos > 0) {
    return { ok: false, motivo: "en_uso", cantidad: tieneProductos };
  }

  await Categoria.update({ padre_id: null }, { where: { padre_id: id } });
  await cat.destroy();
  return { ok: true };
}

// ── Marcas ───────────────────────────────────────────────────────────────

const marcasCrud = crearCrudService(Marca, {
  defaultOrder: [["orden", "ASC"], ["nombre", "ASC"]],
  defaultAttributes: ["id", "nombre", "slug", "logo", "descripcion", "orden", "activo"],
  softDeleteField: "fecha_baja",
});

export async function listarMarcas() {
  const { items } = await marcasCrud.listar();
  return items;
}

export async function existeMarcaConSlug(slug, excluirId = null) {
  const where = { slug, fecha_baja: null };
  if (excluirId) where.id = { [Op.ne]: excluirId };
  return !!(await Marca.findOne({ where }));
}

export async function crearMarca({ nombre, slug, logo = null, descripcion = null, orden = 0 }) {
  return Marca.create({ nombre, slug, logo, descripcion, orden, activo: true, fecha_alta: new Date() });
}

export async function actualizarMarca(id, { nombre, slug, logo = null, descripcion = null, orden = 0 }) {
  const marca = await Marca.findByPk(id);
  if (!marca) return null;
  await marca.update({ nombre, slug, logo, descripcion, orden });
  return marca;
}

export async function eliminarMarca(id) {
  return bajaLogica(Marca, id);
}

// ── Talles ───────────────────────────────────────────────────────────────

const tallesCrud = crearCrudService(Talle, {
  defaultOrder: [["orden", "ASC"]],
  defaultAttributes: ["id", "nombre", "orden"],
  softDeleteField: "fecha_baja",
});

export async function listarTalles() {
  const { items } = await tallesCrud.listar();
  return items;
}

export async function crearTalle({ nombre, orden = 0 }) {
  return Talle.create({ nombre, orden, fecha_alta: new Date() });
}

export async function actualizarTalle(id, { nombre, orden = 0 }) {
  const talle = await Talle.findByPk(id);
  if (!talle) return null;
  await talle.update({ nombre, orden });
  return talle;
}

export async function eliminarTalle(id) {
  return bajaLogica(Talle, id);
}

// ── Colores ──────────────────────────────────────────────────────────────

const coloresCrud = crearCrudService(Color, {
  defaultOrder: [["orden", "ASC"], ["nombre", "ASC"]],
  defaultAttributes: ["id", "nombre", "hex", "orden"],
  softDeleteField: "fecha_baja",
});

export async function listarColores() {
  const { items } = await coloresCrud.listar();
  return items;
}

export async function crearColor({ nombre, hex = null, orden = 0 }) {
  return Color.create({ nombre, hex, orden, fecha_alta: new Date() });
}

export async function actualizarColor(id, { nombre, hex = null, orden = 0 }) {
  const color = await Color.findByPk(id);
  if (!color) return null;
  await color.update({ nombre, hex, orden });
  return color;
}

export async function eliminarColor(id) {
  return bajaLogica(Color, id);
}

// ── Opciones de envío ────────────────────────────────────────────────────

const envioCrud = crearCrudService(EnvioOpcion, {
  defaultOrder: [["precio", "ASC"]],
  defaultAttributes: ["id", "nombre", "descripcion", "precio", "tiempo_estimado", "gratis_desde", "activo"],
  softDeleteField: "fecha_baja",
  where: { activo: true },
});

export async function listarOpcionesEnvio() {
  const { items } = await envioCrud.listar();
  return items;
}

export async function crearOpcionEnvio({ nombre, descripcion, precio, tiempo_estimado, gratis_desde }) {
  return EnvioOpcion.create({
    nombre, descripcion, precio, tiempo_estimado, gratis_desde,
    activo: true, fecha_alta: new Date(),
  });
}

export async function actualizarOpcionEnvio(id, { nombre, descripcion, precio, tiempo_estimado, gratis_desde }) {
  const opcion = await EnvioOpcion.findByPk(id);
  if (!opcion) return null;
  await opcion.update({ nombre, descripcion, precio, tiempo_estimado, gratis_desde });
  return opcion;
}

export async function eliminarOpcionEnvio(id) {
  return bajaLogica(EnvioOpcion, id);
}

// ── Condiciones IVA (solo lectura — fase 2 las usa en checkout/facturación) ──

export async function listarCondicionesIva() {
  return CondicionIva.findAll({
    where: { fecha_baja: null },
    attributes: ["id", "codigo", "nombre"],
    order: [["nombre", "ASC"]],
  });
}
