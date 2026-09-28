import { Op } from "sequelize";
import { proyecto } from "compartido/proyecto.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../nucleo/errores.js";
import { normalizarPaginacion, armarPaginacion } from "../../nucleo/paginacion.js";
import { patronContiene, pick } from "../../nucleo/consultas.js";
import { Categoria, Producto, ProductoImagen, Variante } from "./modelos.js";
import { idsConDescendientes } from "./categoria_servicio.js";
import { generarSlugUnico } from "./slugs.js";
import { Stock } from "../stock/modelos.js";

const CON_STOCK = proyecto.modulos.stock;

const ATRIBUTOS_PRODUCTO = ["id", "categoria_id", "nombre", "slug", "marca", "descripcion", "activo", "publicado", "creado_en", "actualizado_en"];
const ATRIBUTOS_VARIANTE = ["id", "producto_id", "nombre", "atributos", "sku", "precio", "precio_anterior", "iva_porcentaje", "controla_stock", "activo", "orden"];
const CAMPOS_PRODUCTO = ["categoria_id", "nombre", "marca", "descripcion", "activo", "publicado"];
const CAMPOS_VARIANTE = ["nombre", "sku", "atributos", "precio", "precio_anterior", "iva_porcentaje", "controla_stock", "activo"];

// Lista blanca: el cliente elige una clave, nunca una columna.
const ORDENES = {
  nombre: [["nombre", "ASC"], ["id", "ASC"]],
  "-nombre": [["nombre", "DESC"], ["id", "DESC"]],
  reciente: [["creado_en", "DESC"], ["id", "DESC"]],
};

// Sin datos del usuario adentro: seguros como literal.
const conPresentacionActiva = sequelize.literal(
  `EXISTS (SELECT 1 FROM ${DB_SCHEMA}.variante v WHERE v.producto_id = "producto"."id" AND v.activo AND v.eliminado_en IS NULL)`,
);
// Con ocultar_sin_stock: además, al menos una presentación sin control de stock o con disponible > 0.
const conPresentacionConStock = sequelize.literal(
  `EXISTS (SELECT 1 FROM ${DB_SCHEMA}.variante v LEFT JOIN ${DB_SCHEMA}.stock s ON s.variante_id = v.id
    WHERE v.producto_id = "producto"."id" AND v.activo AND v.eliminado_en IS NULL
      AND (NOT v.controla_stock OR COALESCE(s.cantidad - s.reservado, 0) > 0))`,
);

/** "disponible" | "ultimas" (en el mínimo o debajo) | "sin_stock". Sin control de stock: siempre disponible. */
function disponibilidad(variante, stock) {
  if (!CON_STOCK || !variante.controla_stock) return { disponibilidad: "disponible", cantidad_disponible: null };
  const disponible = (stock?.cantidad ?? 0) - (stock?.reservado ?? 0);
  const estado = disponible <= 0 ? "sin_stock" : disponible <= (stock?.minimo ?? 0) ? "ultimas" : "disponible";
  return { disponibilidad: estado, cantidad_disponible: Math.max(disponible, 0) };
}

// El público no ve cantidades internas salvo que la tienda esté configurada para mostrarlas.
function presentar(producto, { publico }) {
  const mostrarCantidad = !publico || proyecto.stock.mostrar_cantidad_en_tienda;
  return {
    ...producto,
    variantes: producto.variantes.map(({ stock, ...variante }) => {
      const { disponibilidad: estado, cantidad_disponible } = disponibilidad(variante, stock);
      return { ...variante, disponibilidad: estado, ...(mostrarCantidad ? { cantidad_disponible } : {}) };
    }),
  };
}

function incluir({ publico }) {
  return [
    { model: Categoria, as: "categoria", attributes: ["id", "nombre", "slug"] },
    {
      model: Variante,
      as: "variantes",
      attributes: ATRIBUTOS_VARIANTE,
      where: { eliminado_en: null, ...(publico ? { activo: true } : {}) },
      required: false,
      separate: true,
      order: [["orden", "ASC"], ["id", "ASC"]],
      include: CON_STOCK ? [{ model: Stock, as: "stock", attributes: ["cantidad", "reservado", "minimo"] }] : [],
    },
    { model: ProductoImagen, as: "imagenes", attributes: ["id", "url", "alt", "orden"], separate: true, order: [["orden", "ASC"], ["id", "ASC"]] },
  ];
}

// El público solo ve productos activos, publicados y con al menos una presentación a la venta.
function condicionesVisibilidad({ publico, estado }) {
  if (publico) return [{ activo: true, publicado: true }, CON_STOCK && proyecto.stock.ocultar_sin_stock ? conPresentacionConStock : conPresentacionActiva];
  if (estado === "activos") return [{ activo: true }];
  if (estado === "inactivos") return [{ activo: false }];
  if (estado === "sin_publicar") return [{ publicado: false }];
  return [];
}

// Sin datos del usuario adentro: seguro como literal.
const conPresentacionEnOferta = sequelize.literal(
  `EXISTS (SELECT 1 FROM ${DB_SCHEMA}.variante v WHERE v.producto_id = "producto"."id" AND v.activo AND v.eliminado_en IS NULL AND v.precio_anterior > v.precio)`,
);

export async function listarProductos({ q, categoria, orden = "nombre", estado = "todos", oferta = false, pagina, limite }, { publico }) {
  const condiciones = [{ eliminado_en: null }, ...condicionesVisibilidad({ publico, estado })];
  if (oferta) condiciones.push(conPresentacionEnOferta);

  if (categoria) {
    condiciones.push({ categoria_id: { [Op.in]: await idsConDescendientes(categoria) } });
  }
  if (q) {
    const patron = patronContiene(q);
    const porCodigo = await Variante.findAll({
      where: { eliminado_en: null, sku: { [Op.iLike]: patron } },
      attributes: ["producto_id"],
      raw: true,
      limit: 500,
    });
    condiciones.push({
      [Op.or]: [
        { nombre: { [Op.iLike]: patron } },
        { marca: { [Op.iLike]: patron } },
        { id: { [Op.in]: porCodigo.map((v) => v.producto_id) } },
      ],
    });
  }

  const pag = normalizarPaginacion({ pagina, limite, limitePorDefecto: proyecto.catalogo.productos_por_pagina });
  const { rows, count } = await Producto.findAndCountAll({
    where: { [Op.and]: condiciones },
    attributes: ATRIBUTOS_PRODUCTO,
    include: incluir({ publico }),
    order: ORDENES[orden] ?? ORDENES.nombre,
    limit: pag.limite,
    offset: pag.offset,
    distinct: true,
  });

  return { data: rows.map((p) => presentar(p.get({ plain: true }), { publico })), paginacion: armarPaginacion({ ...pag, total: count }) };
}

/** Por id (admin) o por slug (URL pública). */
export async function obtenerProducto(clave, { publico }) {
  const porId = /^\d+$/.test(String(clave));
  const producto = await Producto.findOne({
    where: { [Op.and]: [{ eliminado_en: null }, porId ? { id: Number(clave) } : { slug: clave }, ...condicionesVisibilidad({ publico })] },
    attributes: ATRIBUTOS_PRODUCTO,
    include: incluir({ publico }),
  });
  if (!producto) throw new NoEncontrado("El producto no existe o no está disponible.", "PRODUCTO_NO_ENCONTRADO");
  return presentar(producto.get({ plain: true }), { publico });
}

async function validarCategoria(categoria_id, transaction) {
  const existe = await Categoria.findOne({ where: { id: categoria_id, eliminado_en: null }, attributes: ["id"], transaction });
  if (!existe) throw new DatosInvalidos("Revisá los datos ingresados.", [{ campo: "categoria_id", mensaje: "La categoría no existe" }]);
}

async function validarNombreLibre({ nombre, categoria_id, idPropio = null, transaction }) {
  const where = {
    eliminado_en: null,
    categoria_id,
    [Op.and]: sequelize.where(sequelize.fn("lower", sequelize.col("nombre")), nombre.toLowerCase()),
  };
  if (idPropio) where.id = { [Op.ne]: idPropio };
  if (await Producto.findOne({ where, attributes: ["id"], transaction })) {
    throw new Conflicto(`Ya existe el producto "${nombre}" en esa categoría.`, "PRODUCTO_DUPLICADO");
  }
}

// Un código (SKU) no puede repetirse entre productos distintos.
async function validarCodigosLibres({ variantes, idPropio = null, transaction }) {
  const codigos = variantes.map((v) => v.sku?.toLowerCase()).filter(Boolean);
  if (codigos.length === 0) return;
  const usados = await Variante.findAll({
    where: {
      eliminado_en: null,
      [Op.and]: sequelize.where(sequelize.fn("lower", sequelize.col("sku")), { [Op.in]: codigos }),
      ...(idPropio ? { producto_id: { [Op.ne]: idPropio } } : {}),
    },
    attributes: ["sku"],
    raw: true,
    transaction,
  });
  if (usados.length > 0) {
    throw new Conflicto(`El código "${usados[0].sku}" ya lo usa otro producto.`, "SKU_DUPLICADO");
  }
}

function datosVariante(variante, producto_id, orden) {
  return { ...pick(variante, CAMPOS_VARIANTE), producto_id, orden };
}

export async function crearProducto(datos) {
  const id = await sequelize.transaction(async (transaction) => {
    await validarCategoria(datos.categoria_id, transaction);
    await validarNombreLibre({ ...datos, transaction });
    await validarCodigosLibres({ variantes: datos.variantes, transaction });

    const slug = await generarSlugUnico(Producto, datos.nombre, { largo: 170, transaction });
    const producto = await Producto.create({ ...pick(datos, CAMPOS_PRODUCTO), slug }, { transaction });
    await Variante.bulkCreate(
      datos.variantes.map((v, i) => datosVariante(v, producto.id, i)),
      { transaction },
    );
    return producto.id;
  });
  return obtenerProducto(id, { publico: false });
}

/**
 * Reemplaza los datos del producto y sincroniza sus presentaciones:
 * con id → se actualiza · sin id → se crea · las que no vienen → baja lógica.
 */
export async function actualizarProducto(id, datos) {
  await sequelize.transaction(async (transaction) => {
    const producto = await Producto.findOne({ where: { id, eliminado_en: null }, transaction, lock: transaction.LOCK.UPDATE });
    if (!producto) throw new NoEncontrado("El producto no existe.", "PRODUCTO_NO_ENCONTRADO");

    await validarCategoria(datos.categoria_id, transaction);
    await validarNombreLibre({ ...datos, idPropio: producto.id, transaction });
    await validarCodigosLibres({ variantes: datos.variantes, idPropio: producto.id, transaction });

    const actuales = await Variante.findAll({ where: { producto_id: producto.id, eliminado_en: null }, transaction });
    const actualesPorId = new Map(actuales.map((v) => [v.id, v]));
    const ajena = datos.variantes.find((v) => v.id && !actualesPorId.has(v.id));
    if (ajena) {
      throw new DatosInvalidos("Revisá los datos ingresados.", [
        { campo: "variantes", mensaje: `La ${proyecto.catalogo.etiqueta_variante.toLowerCase()} ${ajena.id} no pertenece a este producto` },
      ]);
    }

    const slug = datos.nombre === producto.nombre
      ? producto.slug
      : await generarSlugUnico(Producto, datos.nombre, { excluirId: producto.id, largo: 170, transaction });
    await producto.update({ ...pick(datos, CAMPOS_PRODUCTO), slug }, { transaction });

    // Primero las bajas, así un código o nombre liberado se puede reutilizar en el mismo envío.
    const quedan = new Set(datos.variantes.map((v) => v.id).filter(Boolean));
    const bajas = actuales.filter((v) => !quedan.has(v.id)).map((v) => v.id);
    if (bajas.length > 0) {
      await Variante.update({ eliminado_en: new Date() }, { where: { id: { [Op.in]: bajas } }, transaction });
    }
    for (const [i, variante] of datos.variantes.entries()) {
      if (variante.id) await actualesPorId.get(variante.id).update(datosVariante(variante, producto.id, i), { transaction });
      else await Variante.create(datosVariante(variante, producto.id, i), { transaction });
    }
  });
  return obtenerProducto(id, { publico: false });
}

export async function cambiarEstadoProducto(id, datos) {
  const producto = await Producto.findOne({ where: { id, eliminado_en: null } });
  if (!producto) throw new NoEncontrado("El producto no existe.", "PRODUCTO_NO_ENCONTRADO");
  await producto.update(pick(datos, ["activo", "publicado"]));
  return obtenerProducto(id, { publico: false });
}

export async function eliminarProducto(id) {
  await sequelize.transaction(async (transaction) => {
    const producto = await Producto.findOne({ where: { id, eliminado_en: null }, transaction, lock: transaction.LOCK.UPDATE });
    if (!producto) throw new NoEncontrado("El producto no existe.", "PRODUCTO_NO_ENCONTRADO");
    const ahora = new Date();
    await Variante.update({ eliminado_en: ahora }, { where: { producto_id: id, eliminado_en: null }, transaction });
    await producto.update({ eliminado_en: ahora }, { transaction });
  });
}
