import { Op } from "sequelize";
import { sequelize } from "../../../core/database/sequelize.js";
import { ProductoDistribuidora, CategoriaDistribuidora, VariedadDistribuidora } from "../models/index.js";
import { normalizarPaginacion, armarPaginacion } from "../../../core/services/common/pagination.js";
import { formatearNombre } from "../../../core/services/common/formato_nombre.js";
import { resolverMarcaDeArticulo } from "./marcas_distribuidora_service.js";
import { categoriaAdmiteArticulos, MENSAJE_SOLO_CATEGORIA } from "./articulo_rules.js";
import { rentabilidadResultante } from "../../../../../rubros/eccomerce_distribuidora/precio_desde_costo.js";

// fecha_alta viaja acá para que el admin pueda auditar cuándo se cargó cada
// producto (columna DATEONLY ya existente en el modelo, antes no se
// seleccionaba nunca — invisible aunque siempre estuvo en la base).
const ATTR_LISTADO = ["id", "categoria_id", "nombre", "descripcion", "marca_id", "marca", "imagen_url", "activo", "fecha_alta"];

const ATTR_VARIEDAD = ["id", "nombre", "precio", "precio_anterior", "iva_porcentaje", "controla_stock", "cantidad", "cod_ref",
  "codigo_barras", "unidad_medida", "unidad_bulto", "unidades_por_bulto", "stock_minimo", "fecha_cambio_precio"];
// PRE-70: costo y rentabilidad solo los pide quien cambia precios; la tienda nunca los selecciona.
const includeListado = (conCostos = false) => [
  { model: CategoriaDistribuidora, as: "categoria", attributes: ["id", "nombre", "slug"] },
  {
    model: VariedadDistribuidora, as: "variedades", where: { fecha_baja: null }, required: false,
    attributes: conCostos ? [...ATTR_VARIEDAD, "costo_neto", "rentabilidad"] : ATTR_VARIEDAD,
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

// Ids de productos con alguna presentación vigente que cumple `condicion`.
async function idsConVariedad(condicion) {
  const filas = await VariedadDistribuidora.findAll({ where: { fecha_baja: null, ...condicion }, attributes: ["producto_id"], raw: true });
  return [...new Set(filas.map((v) => v.producto_id))];
}

/**
 * CAT-62/63: el artículo tiene alguna presentación vigente con precio mayor a 0 para la lista de quien
 * mira (su precio especial si la lista lo tiene, si no la General). `listaId` se fuerza a entero.
 */
export const condicionALaVenta = (listaId) => sequelize.literal(`EXISTS (SELECT 1 FROM variedad_distribuidora v
  LEFT JOIN lista_precio_item i ON i.variedad_id = v.id AND i.lista_id = ${Math.trunc(Number(listaId)) || 0}
  WHERE v.producto_id = "ProductoDistribuidora"."id" AND v.fecha_baja IS NULL
    AND (CASE WHEN i.id IS NULL THEN v.precio ELSE i.precio END) > 0)`);

// Órdenes del listado. `con_foto` (CAT-61, inicio de la tienda): primero los que tienen foto.
const ORDENES = {
  nombre: [["nombre", "ASC"]],
  con_foto: [[sequelize.literal('"ProductoDistribuidora"."imagen_url" IS NULL'), "ASC"], ["nombre", "ASC"]],
};
export const ORDENES_LISTADO = Object.keys(ORDENES);

const CONDICION_STOCK = {
  sin_stock: { controla_stock: true, cantidad: { [Op.lte]: 0 } },
  // Incluye los agotados: también están por debajo del mínimo.
  bajo_minimo: { controla_stock: true, stock_minimo: { [Op.gt]: 0 }, [Op.and]: [sequelize.where(sequelize.col("cantidad"), Op.lte, sequelize.col("stock_minimo"))] },
};

// `estado` y `stock` solo los usa la gestión (con soloActivos en false).
async function construirWhere({ categoria, incluirDescendientes = true, q, soloActivos = true, marca, estado, stock, ids, soloALaVenta = false, listaId = null } = {}) {
  const where = { fecha_baja: null };
  // `ids`: subconjunto ya calculado (ej. productos en oferta para la lista del cliente).
  if (Array.isArray(ids)) where.id = { [Op.in]: ids };
  const filtros = [];
  if (soloActivos || estado === "activos") where.activo = true;
  else if (estado === "inactivos") where.activo = false;
  if (categoria) {
    where.categoria_id = incluirDescendientes ? { [Op.in]: await idsConDescendientes(categoria) } : categoria;
  }
  if (marca) where.marca = { [Op.iLike]: String(marca).slice(0, 80) };
  if (q) {
    // `%` y `_` del texto buscado se escapan: son comodines de LIKE.
    const pattern = "%" + String(q).slice(0, 120).replace(/[\\%_]/g, "\\$&") + "%";
    const porCodigo = await idsConVariedad({ [Op.or]: [{ cod_ref: { [Op.iLike]: pattern } }, { codigo_barras: { [Op.iLike]: pattern } }] });
    filtros.push({ [Op.or]: [
      { nombre: { [Op.iLike]: pattern } }, { marca: { [Op.iLike]: pattern } },
      { id: { [Op.in]: porCodigo } },
    ] });
  }
  if (soloALaVenta) filtros.push(condicionALaVenta(listaId));
  if (!soloActivos && CONDICION_STOCK[stock]) filtros.push({ id: { [Op.in]: await idsConVariedad(CONDICION_STOCK[stock]) } });
  if (filtros.length) where[Op.and] = filtros;
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
export async function listarProductos({ categoria, incluirDescendientes = true, q, pagina, por_pagina, soloActivos = true, marca, estado, stock, ids, soloALaVenta = false, listaId = null, orden = "nombre", conCostos = false } = {}) {
  const where = await construirWhere({ categoria, incluirDescendientes, q, soloActivos, marca, estado, stock, ids, soloALaVenta, listaId });
  const maxLimit = soloActivos ? 100 : 1000;
  const { page, limit, offset } = normalizarPaginacion({ page: pagina, limit: por_pagina, defaultLimit: 24, maxLimit });

  const { rows, count } = await ProductoDistribuidora.findAndCountAll({
    where,
    attributes: ATTR_LISTADO,
    include: includeListado(conCostos),
    order: ORDENES[orden] ?? ORDENES.nombre,
    limit,
    offset,
    distinct: true,
  });

  return { productos: rows, pagination: armarPaginacion({ page, limit, total: count }) };
}

export async function obtenerProductoPorId(id, { soloActivos = true, conCostos = false } = {}) {
  const where = { id, fecha_baja: null };
  if (soloActivos) where.activo = true;
  return ProductoDistribuidora.findOne({
    where,
    attributes: ATTR_LISTADO,
    include: includeListado(conCostos),
  });
}

/** Mensaje de error si `categoria_id` no admite artículos (CAT-15); null si está bien. */
export async function errorCategoriaDeArticulo(categoria_id) {
  const id = Number(categoria_id);
  if (!Number.isInteger(id) || id <= 0) return MENSAJE_SOLO_CATEGORIA;
  const categoria = await CategoriaDistribuidora.findByPk(id, { attributes: ["id", "padre_id", "fecha_baja"] });
  return categoriaAdmiteArticulos(categoria) ? null : MENSAJE_SOLO_CATEGORIA;
}

export async function crearProducto(payload, { transaction } = {}) {
  // La marca se elige de la tabla de marcas; `marca` (texto) es la copia de su nombre.
  const marca = await resolverMarcaDeArticulo({ marca_id: payload.marca_id, marca: payload.marca, categoria_id: payload.categoria_id }, transaction);
  return ProductoDistribuidora.create({
    categoria_id: payload.categoria_id,
    nombre: formatearNombre(payload.nombre),
    descripcion: payload.descripcion ?? null,
    ...marca,
    imagen_url: payload.imagen_url ?? null,
    activo: true,
    fecha_alta: new Date(),
  }, { transaction });
}

/**
 * Alta de producto + su variedad en un solo paso — antes había que crear el
 * producto y, en una acción aparte ("Variedades", ya retirada), cargarle
 * precio; hasta ese segundo paso el producto no era comprable. No hay UI
 * para más de una presentación por producto — si en el futuro hace falta,
 * `crearVariedad`/`actualizarVariedad` siguen soportándolo a nivel de datos.
 * Transacción: si la variedad falla (ej. precio inválido), no queda un
 * producto huérfano sin variedad.
 */
// `variedad` llega ya validada con validarVariedad() (services/articulo_rules.js).
export async function crearProductoConVariedad(payload, variedad) {
  const producto = await sequelize.transaction(async (transaction) => {
    const nuevoProducto = await crearProducto(payload, { transaction });
    await crearVariedad(nuevoProducto.id, conRentabilidad(null, variedad), { transaction });
    return nuevoProducto;
  });
  return obtenerProductoPorId(producto.id, { conCostos: true });
}

export async function actualizarProducto(id, payload, { transaction } = {}) {
  const producto = await ProductoDistribuidora.findByPk(id, { transaction });
  if (!producto) return null;
  // Sin `marca_id` en el pedido se conserva la actual (y se asocia a la categoría nueva si cambió).
  const marca = await resolverMarcaDeArticulo({ marca_id: payload.marca_id !== undefined ? payload.marca_id : (payload.marca === undefined ? producto.marca_id : undefined), marca: payload.marca, categoria_id: payload.categoria_id }, transaction);
  await producto.update({
    categoria_id: payload.categoria_id,
    nombre: formatearNombre(payload.nombre),
    descripcion: payload.descripcion ?? null,
    ...marca,
    imagen_url: payload.imagen_url ?? producto.imagen_url,
    activo: payload.activo ?? producto.activo,
    // Activarlo o desactivarlo a mano saca la marca de la lista del cliente (PRE-34b).
    ...(payload.activo != null && payload.activo !== producto.activo ? { inactivo_por_lista: false } : {}),
  }, { transaction });
  return producto;
}

/**
 * Edición de producto + su variedad en un solo paso (mismo criterio que
 * crearProductoConVariedad). Actualiza la variedad más antigua activa del
 * producto — hoy siempre hay como máximo una — y si por algún motivo no
 * tiene ninguna (dato viejo, o se la borró desde la base a mano), la crea
 * en vez de fallar.
 */
const anteriorONulo = (valor) => (valor === null || valor === undefined ? null : Number(valor));
/**
 * true si los datos cambian el precio vigente, el anterior, el costo o la rentabilidad de la presentación (o de una
 * nueva, si no es 0 o trae costo). Costo y rentabilidad solo cuentan si vinieron (PRE-70).
 */
export function cambiaPrecios(variedad, datos) {
  const vinoCosto = datos.costo_neto !== undefined, vinoRentabilidad = datos.rentabilidad !== undefined;
  if (!variedad) {
    return Number(datos.precio) !== 0 || datos.precio_anterior !== null
      || (vinoCosto && datos.costo_neto !== null) || (vinoRentabilidad && datos.rentabilidad !== null);
  }
  return Number(variedad.precio) !== Number(datos.precio) || anteriorONulo(variedad.precio_anterior) !== anteriorONulo(datos.precio_anterior)
    || (vinoCosto && anteriorONulo(variedad.costo_neto) !== anteriorONulo(datos.costo_neto))
    || (vinoRentabilidad && anteriorONulo(variedad.rentabilidad) !== anteriorONulo(datos.rentabilidad));
}

/**
 * PRE-63: con "Precio final" (sin rentabilidad en los datos) el costo se conserva y la rentabilidad se recalcula con
 * el precio nuevo; sin costo, queda vacía. "Desde el costo" ya trae las dos.
 */
export function conRentabilidad(variedad, datos) {
  if (datos.rentabilidad !== undefined) return datos;
  const costo = datos.costo_neto !== undefined ? datos.costo_neto : variedad?.costo_neto;
  return { ...datos, rentabilidad: rentabilidadResultante({ costo, precio: datos.precio, iva: datos.iva_porcentaje }) };
}
export const errorSinPermisoPrecios = () => Object.assign(
  new Error("No tenés permiso para cambiar precios. Guardá el artículo con el precio como estaba y pedile el cambio a un supervisor."),
  { status: 403, codigo: "SIN_PERMISO_PRECIOS" });

// sinPermisoPrecios: quien edita artículos pero no precios puede guardar todo lo demás.
export async function actualizarProductoConVariedad(id, payload, datosVariedad, { sinPermisoPrecios = false } = {}) {
  const producto = await sequelize.transaction(async (transaction) => {
    const actualizado = await actualizarProducto(id, payload, { transaction });
    if (!actualizado) return null;
    const variedad = await VariedadDistribuidora.findOne({
      where: { producto_id: id, fecha_baja: null }, order: [["id", "ASC"]], transaction,
    });
    if (sinPermisoPrecios && cambiaPrecios(variedad, datosVariedad)) throw errorSinPermisoPrecios();
    if (variedad) {
      const cambioPrecio = Number(variedad.precio) !== Number(datosVariedad.precio);
      // Sin permiso de precios no se toca la rentabilidad: el precio no pudo cambiar.
      const datos = sinPermisoPrecios ? datosVariedad : conRentabilidad(variedad, datosVariedad);
      await variedad.update({ ...datos, ...(cambioPrecio ? { fecha_cambio_precio: new Date() } : {}) }, { transaction });
    } else await crearVariedad(id, conRentabilidad(null, datosVariedad), { transaction });
    return actualizado;
  });
  if (!producto) return null;
  return obtenerProductoPorId(id, { conCostos: !sinPermisoPrecios });
}

export async function cambiarEstadoProducto(id, activo) {
  const producto = await ProductoDistribuidora.findByPk(id);
  if (!producto) return null;
  await producto.update({ activo, inactivo_por_lista: false });
  return producto;
}

export async function eliminarProducto(id) {
  const producto = await ProductoDistribuidora.findByPk(id);
  if (!producto) return null;
  await producto.update({ fecha_baja: new Date() });
  return producto;
}

// ── Variedades — un producto necesita una para ser comprable. Sin UI propia:
// se maneja siempre junto al producto (ver crearProductoConVariedad /
// actualizarProductoConVariedad más arriba) — crearVariedad queda como
// función de datos, reutilizable si en el futuro hiciera falta más de una
// presentación por producto. ──────────────────────────────────────────────

export async function crearVariedad(producto_id, { nombre = null, ...datos }, { transaction } = {}) {
  return VariedadDistribuidora.create({
    precio_anterior: null, iva_porcentaje: 21, controla_stock: false, cantidad: 0, cod_ref: null,
    ...datos, producto_id, nombre, fecha_alta: new Date(), fecha_cambio_precio: new Date(),
  }, { transaction });
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

  // PRE-64: con costo, el porcentaje va al costo neto y el precio se recalcula con su rentabilidad (pesos enteros,
  // PRE-61); con costo sin rentabilidad, costo y precio suben igual. Sin costo, se ajusta el precio final como siempre.
  // `factor` es un número validado arriba: no entra texto del usuario en el SQL.
  const nuevoCosto = `ROUND(costo_neto * ${factor}, 2)`;
  const [conCosto] = await VariedadDistribuidora.update({
    costo_neto: sequelize.literal(nuevoCosto),
    precio: sequelize.literal(`CASE WHEN rentabilidad IS NULL THEN ROUND(precio * ${factor}, 2)
      ELSE ROUND(${nuevoCosto} * (1 + rentabilidad / 100) * (1 + iva_porcentaje / 100)) END`),
    fecha_cambio_precio: new Date(),
  }, { where: { ...where, costo_neto: { [Op.ne]: null } } });
  const [sinCosto] = await VariedadDistribuidora.update(
    { precio: sequelize.literal(`ROUND(precio * ${factor}, 2)`), fecha_cambio_precio: new Date() },
    { where: { ...where, costo_neto: null } }
  );

  return conCosto + sinCosto;
}
