import { Op } from "sequelize";
import { ProductoTienda, Categoria, Marca, Stock, Talle, Color } from "../../models/index.js";
import { normalizarPaginacion, armarPaginacion } from "../common/pagination.js";

const ATTR_LISTADO = [
  "id", "categoria_id", "marca_id", "nombre", "descripcion",
  "precio", "precio_anterior", "descuento", "badge", "cod_ref", "imagenes", "activo",
];

const INCLUDE_LISTADO = [
  { model: Categoria, as: "categoria", attributes: ["id", "nombre", "slug"] },
  { model: Marca, as: "marca", attributes: ["id", "nombre", "slug"] },
];

function construirWhere({ categoria, marca, precio_max, solo_ofertas, solo_stock } = {}) {
  const where = { activo: true, fecha_baja: null };
  if (categoria) where.categoria_id = categoria;
  if (marca) where.marca_id = marca;
  if (precio_max) where.precio = { [Op.lte]: Number(precio_max) };
  if (solo_ofertas === "true" || solo_ofertas === true) where.precio_anterior = { [Op.ne]: null };
  return where;
}

function construirOrden(orden) {
  switch (orden) {
    case "precio_asc":  return [["precio", "ASC"]];
    case "precio_desc": return [["precio", "DESC"]];
    case "nombre":       return [["nombre", "ASC"]];
    default:              return [["fecha_alta", "DESC"]];
  }
}

export async function listarProductos({
  categoria, marca, precio_max, solo_ofertas, solo_stock, orden,
  pagina, por_pagina,
} = {}) {
  const where = construirWhere({ categoria, marca, precio_max, solo_ofertas, solo_stock });
  const { page, limit, offset } = normalizarPaginacion({ page: pagina, limit: por_pagina, defaultLimit: 24 });

  let productoIds = null;
  if (solo_stock === "true" || solo_stock === true) {
    const conStock = await Stock.findAll({
      where: { cantidad: { [Op.gt]: 0 }, fecha_baja: null },
      attributes: ["producto_id"],
      group: ["producto_id"],
    });
    productoIds = conStock.map((s) => s.producto_id);
    if (productoIds.length === 0) {
      return { productos: [], pagination: armarPaginacion({ page, limit, total: 0 }) };
    }
    where.id = { [Op.in]: productoIds };
  }

  const { rows, count } = await ProductoTienda.findAndCountAll({
    where,
    attributes: ATTR_LISTADO,
    include: INCLUDE_LISTADO,
    order: construirOrden(orden),
    limit,
    offset,
    distinct: true,
  });

  return { productos: rows, pagination: armarPaginacion({ page, limit, total: count }) };
}

export async function obtenerProductoPorId(id) {
  return ProductoTienda.findOne({
    where: { id, fecha_baja: null },
    attributes: ATTR_LISTADO,
    include: [
      ...INCLUDE_LISTADO,
      {
        model: Stock, as: "variantes", where: { fecha_baja: null }, required: false,
        attributes: ["id", "talle_id", "color_id", "cantidad"],
        include: [
          { model: Talle, as: "talle", attributes: ["id", "nombre"] },
          { model: Color, as: "color", attributes: ["id", "nombre", "hex"] },
        ],
      },
    ],
  });
}

export async function obtenerOfertasDestacadas(limite = 8) {
  return ProductoTienda.findAll({
    where: { activo: true, fecha_baja: null, precio_anterior: { [Op.ne]: null } },
    attributes: ATTR_LISTADO,
    include: INCLUDE_LISTADO,
    order: [["fecha_alta", "DESC"]],
    limit: limite,
  });
}

export async function crearProducto(payload) {
  return ProductoTienda.create({
    categoria_id: payload.categoria_id,
    marca_id: payload.marca_id ?? null,
    nombre: payload.nombre,
    descripcion: payload.descripcion ?? null,
    precio: payload.precio,
    precio_anterior: payload.precio_anterior ?? null,
    descuento: payload.descuento ?? null,
    badge: payload.badge ?? null,
    cod_ref: payload.cod_ref ?? null,
    imagenes: payload.imagenes ?? [],
    activo: true,
    fecha_alta: new Date(),
  });
}

export async function actualizarProducto(id, payload) {
  const producto = await ProductoTienda.findByPk(id);
  if (!producto) return null;
  await producto.update({
    categoria_id: payload.categoria_id,
    marca_id: payload.marca_id ?? null,
    nombre: payload.nombre,
    descripcion: payload.descripcion ?? null,
    precio: payload.precio,
    precio_anterior: payload.precio_anterior ?? null,
    descuento: payload.descuento ?? null,
    badge: payload.badge ?? null,
    cod_ref: payload.cod_ref ?? null,
    imagenes: payload.imagenes ?? producto.imagenes,
    activo: payload.activo ?? producto.activo,
  });
  return producto;
}

// ── Stock bajo (alertas) ─────────────────────────────────────────────────
// Une stock + producto + marca + talle + color para armar la etiqueta de
// "variante" que espera el frontend (ver modules/eccomerce_indumentaria/productos/
// admin_stock_alerts_page.jsx).

export async function obtenerStockBajo(umbral = 1) {
  const filas = await Stock.findAll({
    where: { cantidad: { [Op.lte]: umbral }, fecha_baja: null },
    attributes: ["id", "producto_id", "cantidad"],
    include: [
      {
        model: ProductoTienda, as: "producto", attributes: ["id", "nombre", "activo"],
        where: { activo: true, fecha_baja: null },
        include: [{ model: Marca, as: "marca", attributes: ["nombre"] }],
      },
      { model: Talle, as: "talle", attributes: ["nombre"] },
      { model: Color, as: "color", attributes: ["nombre"] },
    ],
    order: [["cantidad", "ASC"]],
  });

  return filas.map((s) => {
    const partes = [s.talle?.nombre, s.color?.nombre].filter(Boolean);
    return {
      producto_id: s.producto_id,
      producto_nombre: s.producto?.nombre,
      marca: s.producto?.marca?.nombre ?? null,
      variante: partes.length > 0 ? partes.join(" / ") : null,
      stock: s.cantidad,
    };
  });
}

// ── CSV (export/import simple, sin librerías externas) ───────────────────

const CSV_COLUMNAS = ["id", "nombre", "categoria", "marca", "precio", "precio_anterior", "activo"];

function csvEscape(valor) {
  const texto = String(valor ?? "");
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function csvParseLine(linea) {
  const valores = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (entreComillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i++; }
      else if (c === '"') entreComillas = false;
      else actual += c;
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      valores.push(actual); actual = "";
    } else {
      actual += c;
    }
  }
  valores.push(actual);
  return valores;
}

export async function generarCatalogoCSV() {
  const productos = await ProductoTienda.findAll({
    where: { fecha_baja: null },
    attributes: ["id", "nombre", "precio", "precio_anterior", "activo"],
    include: [
      { model: Categoria, as: "categoria", attributes: ["nombre"] },
      { model: Marca, as: "marca", attributes: ["nombre"] },
    ],
    order: [["nombre", "ASC"]],
  });

  const filas = [CSV_COLUMNAS.join(",")];
  for (const p of productos) {
    filas.push([
      p.id, p.nombre, p.categoria?.nombre ?? "", p.marca?.nombre ?? "",
      p.precio, p.precio_anterior ?? "", p.activo,
    ].map(csvEscape).join(","));
  }
  return filas.join("\n");
}

/**
 * Importa/actualiza productos desde CSV. Matchea por `id` (si viene y
 * existe, actualiza) o por `nombre` + `categoria` (si no, crea). Categoría
 * y marca se resuelven por nombre — si no existen, el producto se salta y
 * se reporta en errores (no crea catálogos nuevos on-the-fly).
 */
export async function importarCatalogoCSV(contenidoCsv) {
  const lineas = contenidoCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lineas.length < 2) return { creados: 0, actualizados: 0, errores: ["El CSV no tiene filas de datos"] };

  const headers = csvParseLine(lineas[0]).map((h) => h.trim().toLowerCase());
  const idx = (col) => headers.indexOf(col);

  const [categorias, marcas] = await Promise.all([
    Categoria.findAll({ where: { fecha_baja: null }, attributes: ["id", "nombre"] }),
    Marca.findAll({ where: { fecha_baja: null }, attributes: ["id", "nombre"] }),
  ]);
  const categoriaPorNombre = new Map(categorias.map((c) => [c.nombre.toLowerCase(), c.id]));
  const marcaPorNombre = new Map(marcas.map((m) => [m.nombre.toLowerCase(), m.id]));

  let creados = 0, actualizados = 0;
  const errores = [];

  for (let i = 1; i < lineas.length; i++) {
    const valores = csvParseLine(lineas[i]);
    const fila = Object.fromEntries(headers.map((h, j) => [h, valores[j]?.trim()]));
    const numeroFila = i + 1;

    if (!fila.nombre) { errores.push(`Fila ${numeroFila}: falta "nombre"`); continue; }
    if (!fila.precio || Number.isNaN(Number(fila.precio))) { errores.push(`Fila ${numeroFila}: "precio" inválido`); continue; }

    const categoria_id = fila.categoria ? categoriaPorNombre.get(fila.categoria.toLowerCase()) : undefined;
    if (fila.categoria && !categoria_id) { errores.push(`Fila ${numeroFila}: categoría "${fila.categoria}" no existe`); continue; }

    const marca_id = fila.marca ? marcaPorNombre.get(fila.marca.toLowerCase()) : null;

    const datos = {
      nombre: fila.nombre,
      precio: Number(fila.precio),
      precio_anterior: fila.precio_anterior ? Number(fila.precio_anterior) : null,
      activo: fila.activo === undefined ? true : fila.activo.toLowerCase() !== "false",
      ...(marca_id !== undefined && { marca_id }),
      ...(categoria_id !== undefined && { categoria_id }),
    };

    const idExistente = idx("id") !== -1 ? fila.id : null;
    if (idExistente) {
      const producto = await ProductoTienda.findByPk(idExistente);
      if (producto) {
        await producto.update(datos);
        actualizados++;
        continue;
      }
    }

    if (!categoria_id) { errores.push(`Fila ${numeroFila}: falta "categoria" para crear el producto`); continue; }

    await ProductoTienda.create({ ...datos, categoria_id, fecha_alta: new Date() });
    creados++;
  }

  return { creados, actualizados, errores };
}
