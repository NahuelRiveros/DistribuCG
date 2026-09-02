import { Op } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { ProductoDistribuidora, CategoriaDistribuidora, VariedadDistribuidora } from "../../models/index.js";
import { normalizarPaginacion, armarPaginacion } from "../common/pagination.js";

const ATTR_LISTADO = ["id", "categoria_id", "nombre", "descripcion", "marca", "imagen_url", "activo"];

const INCLUDE_LISTADO = [
  { model: CategoriaDistribuidora, as: "categoria", attributes: ["id", "nombre", "slug"] },
  {
    model: VariedadDistribuidora, as: "variedades", where: { fecha_baja: null }, required: false,
    attributes: ["id", "nombre", "precio", "precio_anterior", "controla_stock", "cantidad", "cod_ref"],
  },
];

function construirWhere({ categoria, q } = {}) {
  const where = { activo: true, fecha_baja: null };
  if (categoria) where.categoria_id = categoria;
  if (q) where.nombre = { [Op.iLike]: `%${q}%` };
  return where;
}

export async function listarProductos({ categoria, q, pagina, por_pagina } = {}) {
  const where = construirWhere({ categoria, q });
  const { page, limit, offset } = normalizarPaginacion({ page: pagina, limit: por_pagina, defaultLimit: 24 });

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

export async function obtenerProductoPorId(id) {
  return ProductoDistribuidora.findOne({
    where: { id, fecha_baja: null },
    attributes: ATTR_LISTADO,
    include: INCLUDE_LISTADO,
  });
}

export async function crearProducto(payload) {
  return ProductoDistribuidora.create({
    categoria_id: payload.categoria_id,
    nombre: payload.nombre,
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
    nombre: payload.nombre,
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

export async function crearVariedad(producto_id, { nombre = null, precio, precio_anterior = null, controla_stock = false, cantidad = 0, cod_ref = null }) {
  return VariedadDistribuidora.create({
    producto_id, nombre, precio, precio_anterior, controla_stock, cantidad, cod_ref,
    fecha_alta: new Date(),
  });
}

export async function actualizarVariedad(id, { nombre, precio, precio_anterior = null, controla_stock = false, cantidad, cod_ref = null }) {
  const variedad = await VariedadDistribuidora.findByPk(id);
  if (!variedad) return null;
  await variedad.update({ nombre, precio, precio_anterior, controla_stock, cantidad, cod_ref });
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
      where: { categoria_id, fecha_baja: null },
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
