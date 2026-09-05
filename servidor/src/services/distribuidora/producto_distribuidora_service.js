import { Op } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { ProductoDistribuidora, CategoriaDistribuidora, VariedadDistribuidora } from "../../models/index.js";
import { normalizarPaginacion, armarPaginacion } from "../common/pagination.js";
import { capitalizar } from "../common/query_helpers.js";

// fecha_alta viaja acá para que el admin pueda auditar cuándo se cargó cada
// producto (columna DATEONLY ya existente en el modelo, antes no se
// seleccionaba nunca — invisible aunque siempre estuvo en la base).
const ATTR_LISTADO = ["id", "categoria_id", "nombre", "descripcion", "marca", "imagen_url", "activo", "fecha_alta"];

const INCLUDE_LISTADO = [
  { model: CategoriaDistribuidora, as: "categoria", attributes: ["id", "nombre", "slug"] },
  {
    model: VariedadDistribuidora, as: "variedades", where: { fecha_baja: null }, required: false,
    attributes: ["id", "nombre", "precio", "precio_anterior", "iva_porcentaje", "controla_stock", "cantidad", "cod_ref"],
  },
];

// Cache en memoria del árbol de categorías (solo id/padre_id) — las
// categorías cambian rarísima vez, pero antes se releía la tabla entera en
// CADA búsqueda de productos con filtro de categoría. TTL corto en vez de
// invalidación cruzada con catalogos_distribuidora_service.js: a los 60s se
// autocorrige solo, no hace falta acoplar los dos archivos.
let cacheArbolCategorias = { filas: null, expiraEn: 0 };
async function obtenerCategoriasCacheadas() {
  if (Date.now() > cacheArbolCategorias.expiraEn) {
    const filas = await CategoriaDistribuidora.findAll({
      where: { fecha_baja: null }, attributes: ["id", "padre_id"],
    });
    cacheArbolCategorias = { filas, expiraEn: Date.now() + 60_000 };
  }
  return cacheArbolCategorias.filas;
}

// Una categoría "padre" (ej. Comestibles) normalmente no tiene productos
// cargados directo — están en sus subcategorías (Galletitas, Fideos, etc.).
// Filtrar por categoria_id exacto dejaba la categoría padre siempre vacía.
// Acá resolvemos la categoría elegida + TODOS sus descendientes (recursivo,
// cualquier profundidad) para que filtrar por el padre traiga todo lo de
// abajo también.
async function idsConDescendientes(categoriaId) {
  // req.query siempre trae strings ("6", no 6) — sin este Number(), el Map de
  // abajo (con claves numéricas de verdad, padre_id sale de Postgres como
  // number) nunca encontraba a los hijos de la categoría elegida: filtrar por
  // cualquier categoría que no fuera una hoja exacta devolvía "sin resultados".
  const catId = Number(categoriaId);
  const todas = await obtenerCategoriasCacheadas();
  const hijosPorPadre = new Map();
  for (const c of todas) {
    if (!hijosPorPadre.has(c.padre_id)) hijosPorPadre.set(c.padre_id, []);
    hijosPorPadre.get(c.padre_id).push(c.id);
  }
  const ids = [catId];
  const pendientes = [catId];
  while (pendientes.length > 0) {
    const actual = pendientes.pop();
    for (const hijoId of hijosPorPadre.get(actual) ?? []) {
      ids.push(hijoId);
      pendientes.push(hijoId);
    }
  }
  return ids;
}

async function construirWhere({ categoria, incluirDescendientes = true, q, soloActivos = true } = {}) {
  const where = { fecha_baja: null };
  if (soloActivos) where.activo = true;
  if (categoria) {
    where.categoria_id = incluirDescendientes ? { [Op.in]: await idsConDescendientes(categoria) } : categoria;
  }
  if (q) where.nombre = { [Op.iLike]: `%${q}%` };
  return where;
}

// `soloActivos` en false = ve también los productos desactivados (admin/staff
// gestionando el catálogo); en true = solo lo que ve un cliente en el catálogo público.
// `maxLimit` sube a 1000 solo para el admin (carga perezosa por categoría del
// árbol: una categoría entera se trae de una — el catálogo público se queda
// con el tope de 100 de siempre, no tiene sentido pedirle más de una página).
// `incluirDescendientes` en false = SOLO los productos con esa categoria_id
// exacta (sin bajar a subcategorías) — lo usa el árbol del admin al expandir
// un nivel puntual, para no traerse de golpe todo el subárbol y mezclarlo
// bajo el nodo equivocado.
export async function listarProductos({ categoria, incluirDescendientes = true, q, pagina, por_pagina, soloActivos = true } = {}) {
  const where = await construirWhere({ categoria, incluirDescendientes, q, soloActivos });
  const maxLimit = soloActivos ? 100 : 1000;
  const { page, limit, offset } = normalizarPaginacion({ page: pagina, limit: por_pagina, defaultLimit: 24, maxLimit });

  const { rows, count } = await ProductoDistribuidora.findAndCountAll({
    where,
    attributes: ATTR_LISTADO,
    include: INCLUDE_LISTADO,
    order: [["nombre", "ASC"]],
    limit,
    offset,
    distinct: true,
  });

  return { productos: rows, pagination: armarPaginacion({ page, limit, total: count }) };
}

export async function obtenerProductoPorId(id, { soloActivos = true } = {}) {
  const where = { id, fecha_baja: null };
  if (soloActivos) where.activo = true;
  return ProductoDistribuidora.findOne({
    where,
    attributes: ATTR_LISTADO,
    include: INCLUDE_LISTADO,
  });
}

export async function crearProducto(payload) {
  return ProductoDistribuidora.create({
    categoria_id: payload.categoria_id,
    nombre: capitalizar(payload.nombre),
    descripcion: payload.descripcion ?? null,
    marca: payload.marca ?? null,
    imagen_url: payload.imagen_url ?? null,
    activo: true,
    fecha_alta: new Date(),
  });
}

export async function actualizarProducto(id, payload) {
  const producto = await ProductoDistribuidora.findByPk(id);
  if (!producto) return null;
  await producto.update({
    categoria_id: payload.categoria_id,
    nombre: capitalizar(payload.nombre),
    descripcion: payload.descripcion ?? null,
    marca: payload.marca ?? null,
    imagen_url: payload.imagen_url ?? producto.imagen_url,
    activo: payload.activo ?? producto.activo,
  });
  return producto;
}

export async function cambiarEstadoProducto(id, activo) {
  const producto = await ProductoDistribuidora.findByPk(id);
  if (!producto) return null;
  await producto.update({ activo });
  return producto;
}

export async function eliminarProducto(id) {
  const producto = await ProductoDistribuidora.findByPk(id);
  if (!producto) return null;
  await producto.update({ fecha_baja: new Date() });
  return producto;
}

// ── Variedades — un producto necesita ≥1 para ser comprable ────────────────

export async function crearVariedad(producto_id, { nombre = null, precio, precio_anterior = null, iva_porcentaje = 21, controla_stock = false, cantidad = 0, cod_ref = null }) {
  return VariedadDistribuidora.create({
    producto_id, nombre, precio, precio_anterior, iva_porcentaje, controla_stock, cantidad, cod_ref,
    fecha_alta: new Date(),
  });
}

export async function actualizarVariedad(id, { nombre, precio, precio_anterior = null, iva_porcentaje = 21, controla_stock = false, cantidad, cod_ref = null }) {
  const variedad = await VariedadDistribuidora.findByPk(id);
  if (!variedad) return null;
  await variedad.update({ nombre, precio, precio_anterior, iva_porcentaje, controla_stock, cantidad, cod_ref });
  return variedad;
}

/**
 * Ajuste masivo de precios — sube o baja (porcentaje negativo) el precio de
 * TODAS las variedades que caen dentro del filtro, en una sola operación.
 * No toca `precio_anterior` — eso queda para marcar una oferta puntual,
 * no se pisa solo porque cambió la lista de precios.
 *
 * Alcance según qué se pase:
 *   - producto_id  → solo las variedades de ese producto.
 *   - categoria_id → todos los productos de esa categoría.
 *   - ninguno de los dos → TODO el catálogo (el controller exige una
 *     confirmación explícita aparte para este caso).
 */
export async function ajustarPreciosMasivo({ porcentaje, producto_id = null, categoria_id = null }) {
  const factor = 1 + Number(porcentaje) / 100;
  if (!Number.isFinite(factor) || factor <= 0) {
    throw Object.assign(new Error("Porcentaje inválido"), { status: 400 });
  }

  const where = { fecha_baja: null };
  if (producto_id) {
    where.producto_id = producto_id;
  } else if (categoria_id) {
    const productos = await ProductoDistribuidora.findAll({
      where: { categoria_id: { [Op.in]: await idsConDescendientes(categoria_id) }, fecha_baja: null },
      attributes: ["id"],
    });
    if (productos.length === 0) return 0;
    where.producto_id = { [Op.in]: productos.map((p) => p.id) };
  }
  // ni producto_id ni categoria_id → sin filtro extra, afecta todo el catálogo

  const [cantidadActualizada] = await VariedadDistribuidora.update(
    { precio: sequelize.literal(`ROUND(precio * ${factor}, 2)`) },
    { where }
  );

  return cantidadActualizada;
}

export async function eliminarVariedad(id) {
  const variedad = await VariedadDistribuidora.findByPk(id);
  if (!variedad) return null;
  await variedad.update({ fecha_baja: new Date() });
  return variedad;
}
