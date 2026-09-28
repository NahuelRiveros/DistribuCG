import { QueryTypes } from "sequelize";
import { proyecto } from "compartido/proyecto.js";
import { totalesLinea, totalesPedido } from "compartido/reglas/pedido_totales.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, NoAutorizado, NoEncontrado } from "../../nucleo/errores.js";
import { Usuario } from "../usuarios/modelos.js";
import { Carrito, CarritoItem } from "./modelos.js";
import { idempotente } from "./idempotencia.js";

const { max_lineas_carrito, max_cantidad_item } = proyecto.tienda;
const CON_STOCK = proyecto.modulos.stock;
const MOSTRAR_CANTIDAD = proyecto.stock.mostrar_cantidad_en_tienda;

/**
 * Datos actuales de las presentaciones (precio, IVA, si se puede vender y cuánto hay).
 * `bloquear`: FOR UPDATE sobre las variantes, para que precio y stock no cambien
 * mientras se arma un pedido.
 */
export async function datosVariantes(ids, { transaction, bloquear = false } = {}) {
  if (ids.length === 0) return new Map();
  const filas = await sequelize.query(
    `SELECT v.id AS variante_id, v.producto_id, p.slug, p.nombre AS producto, v.nombre AS presentacion, v.sku,
            v.precio, v.iva_porcentaje, v.controla_stock,
            (v.activo AND v.eliminado_en IS NULL AND p.activo AND p.publicado AND p.eliminado_en IS NULL) AS vendible,
            ${CON_STOCK ? "COALESCE(s.cantidad - s.reservado, 0)" : "NULL"} AS disponible,
            (SELECT url FROM ${DB_SCHEMA}.producto_imagen i WHERE i.producto_id = p.id ORDER BY i.orden, i.id LIMIT 1) AS imagen
     FROM ${DB_SCHEMA}.variante v
     JOIN ${DB_SCHEMA}.producto p ON p.id = v.producto_id
     ${CON_STOCK ? `LEFT JOIN ${DB_SCHEMA}.stock s ON s.variante_id = v.id` : ""}
     WHERE v.id IN (:ids)
     ORDER BY v.id
     ${bloquear ? "FOR UPDATE OF v" : ""}`,
    { replacements: { ids }, type: QueryTypes.SELECT, transaction },
  );
  return new Map(filas.map((f) => [f.variante_id, f]));
}

const limiteStock = (dato) => (CON_STOCK && dato.controla_stock ? Math.max(Number(dato.disponible), 0) : null);

function mensajeFaltaStock(dato) {
  const nombre = dato.presentacion ? `${dato.producto} (${dato.presentacion})` : dato.producto;
  const disponible = limiteStock(dato);
  if (disponible === 0) return `${nombre} no tiene stock.`;
  return MOSTRAR_CANTIDAD ? `De ${nombre} hay ${disponible} disponible(s).` : `No hay stock suficiente de ${nombre} para esa cantidad.`;
}

/** Una línea del carrito con precios actuales y los problemas que tenga. */
export function armarLinea({ item_id = null, variante_id, cantidad, precio_al_agregar = null }, dato) {
  if (!dato) {
    return { item_id, variante_id, cantidad, problema: "no_disponible", mensaje: "Este producto ya no está disponible." };
  }
  const totales = totalesLinea({ precio: dato.precio, iva_porcentaje: dato.iva_porcentaje, cantidad });
  const tope = limiteStock(dato);
  let problema = null;
  let mensaje = null;
  if (!dato.vendible) {
    problema = "no_disponible";
    mensaje = "Este producto ya no está disponible.";
  } else if (tope != null && cantidad > tope) {
    problema = tope === 0 ? "sin_stock" : "stock_insuficiente";
    mensaje = mensajeFaltaStock(dato);
  }
  return {
    item_id,
    variante_id,
    producto_id: dato.producto_id,
    slug: dato.slug,
    producto: dato.producto,
    presentacion: dato.presentacion,
    sku: dato.sku,
    imagen: dato.imagen,
    cantidad,
    precio: dato.precio,
    iva_porcentaje: dato.iva_porcentaje,
    ...totales,
    precio_cambio: precio_al_agregar != null && Number(precio_al_agregar) !== Number(dato.precio),
    ...(MOSTRAR_CANTIDAD && tope != null ? { disponible: tope } : {}),
    problema,
    mensaje,
  };
}

/** Carrito completo: líneas, totales (solo de lo que se puede vender) y si se puede enviar. */
export function armarCarrito(lineas) {
  const vendibles = lineas.filter((l) => !l.problema);
  const totales = totalesPedido(vendibles.map((l) => ({ precio: l.precio, iva_porcentaje: l.iva_porcentaje, cantidad: l.cantidad })));
  const minimo = proyecto.tienda.pedido_minimo;
  const faltaMinimo = minimo != null && totales.total < minimo;
  return {
    items: lineas,
    totales,
    cantidad_unidades: lineas.reduce((s, l) => s + l.cantidad, 0),
    pedido_minimo: minimo,
    se_puede_enviar: lineas.length > 0 && vendibles.length === lineas.length && !faltaMinimo,
  };
}

async function lineasDelCarrito(carrito_id, transaction) {
  const items = await CarritoItem.findAll({ where: { carrito_id }, order: [["id", "ASC"]], transaction });
  const datos = await datosVariantes(items.map((i) => i.variante_id), { transaction });
  return items.map((i) => armarLinea({ item_id: i.id, variante_id: i.variante_id, cantidad: i.cantidad, precio_al_agregar: i.precio_al_agregar }, datos.get(i.variante_id)));
}

/**
 * Toda operación sobre el carrito de un usuario se serializa (FOR UPDATE sobre el usuario):
 * dos pestañas agregando a la vez, o agregar mientras se envía el pedido, no se pisan.
 * Traído de DistribuCG (cart_transaction.js → withCart).
 */
export async function conCarrito(usuario_id, accion) {
  return sequelize.transaction(async (transaction) => {
    const usuario = await Usuario.findByPk(usuario_id, { attributes: ["id"], transaction, lock: transaction.LOCK.UPDATE });
    if (!usuario) throw new NoAutorizado();
    const [carrito] = await Carrito.findOrCreate({ where: { usuario_id }, defaults: { usuario_id }, transaction });
    return accion(carrito, transaction);
  });
}

export const verCarrito = (usuario_id) => conCarrito(usuario_id, async (carrito, t) => armarCarrito(await lineasDelCarrito(carrito.id, t)));

/** Suma al carrito (si ya estaba, acumula). `recortar`: ajusta a lo disponible en vez de rechazar (fusión). */
async function sumarAlCarrito(carrito, { variante_id, cantidad }, transaction, { recortar = false } = {}) {
  const dato = (await datosVariantes([variante_id], { transaction })).get(variante_id);
  if (!dato || !dato.vendible) {
    if (recortar) return "Un producto ya no está disponible y no se agregó.";
    throw new NoEncontrado("Ese producto no está disponible.", "PRODUCTO_NO_DISPONIBLE");
  }
  const existente = await CarritoItem.findOne({ where: { carrito_id: carrito.id, variante_id }, transaction });
  if (!existente && (await CarritoItem.count({ where: { carrito_id: carrito.id }, transaction })) >= max_lineas_carrito) {
    if (recortar) return `Se alcanzó el máximo de ${max_lineas_carrito} productos por pedido.`;
    throw new Conflicto(`El pedido puede tener hasta ${max_lineas_carrito} productos distintos.`, "CARRITO_LLENO");
  }
  let total = Math.min((existente?.cantidad ?? 0) + cantidad, max_cantidad_item);
  const tope = limiteStock(dato);
  let aviso = null;
  if (tope != null && total > tope) {
    if (!recortar || tope <= (existente?.cantidad ?? 0)) {
      if (recortar) return mensajeFaltaStock(dato);
      throw new Conflicto(mensajeFaltaStock(dato), "STOCK_INSUFICIENTE");
    }
    total = tope;
    aviso = mensajeFaltaStock(dato);
  }
  if (existente) await existente.update({ cantidad: total, precio_al_agregar: dato.precio }, { transaction });
  else await CarritoItem.create({ carrito_id: carrito.id, variante_id, cantidad: total, precio_al_agregar: dato.precio }, { transaction });
  return aviso;
}

export const agregarItem = (usuario_id, datos) =>
  conCarrito(usuario_id, async (carrito, t) => {
    await sumarAlCarrito(carrito, datos, t);
    return armarCarrito(await lineasDelCarrito(carrito.id, t));
  });

export const cambiarCantidad = (usuario_id, item_id, cantidad) =>
  conCarrito(usuario_id, async (carrito, t) => {
    const item = await CarritoItem.findOne({ where: { id: item_id, carrito_id: carrito.id }, transaction: t });
    if (!item) throw new NoEncontrado("Ese producto no está en tu carrito.", "ITEM_NO_ENCONTRADO");
    const dato = (await datosVariantes([item.variante_id], { transaction: t })).get(item.variante_id);
    const tope = dato && limiteStock(dato);
    // Bajar la cantidad siempre se permite; subirla, solo hasta lo disponible.
    if (tope != null && cantidad > item.cantidad && cantidad > tope) throw new Conflicto(mensajeFaltaStock(dato), "STOCK_INSUFICIENTE");
    await item.update({ cantidad, ...(dato ? { precio_al_agregar: dato.precio } : {}) }, { transaction: t });
    return armarCarrito(await lineasDelCarrito(carrito.id, t));
  });

export const quitarItem = (usuario_id, item_id) =>
  conCarrito(usuario_id, async (carrito, t) => {
    await CarritoItem.destroy({ where: { id: item_id, carrito_id: carrito.id }, transaction: t });
    return armarCarrito(await lineasDelCarrito(carrito.id, t));
  });

export const vaciarCarrito = (usuario_id) =>
  conCarrito(usuario_id, async (carrito, t) => {
    await CarritoItem.destroy({ where: { carrito_id: carrito.id }, transaction: t });
    return armarCarrito([]);
  });

/**
 * Suma al carrito de la cuenta lo que el visitante armó sin iniciar sesión.
 * Idempotente: si se repite (recarga, doble login) no duplica cantidades.
 * Lo que no se puede agregar entero se recorta y se informa en `avisos`.
 */
export const fusionarCarrito = (usuario_id, { clave, items }) =>
  conCarrito(usuario_id, async (carrito, t) => {
    const avisos = await idempotente({ usuario_id, clave: `fusion:${clave}`, datos: items, transaction: t }, async () => {
      const mensajes = [];
      for (const item of items) {
        const aviso = await sumarAlCarrito(carrito, item, t, { recortar: true });
        if (aviso) mensajes.push(aviso);
      }
      return mensajes;
    });
    return { ...armarCarrito(await lineasDelCarrito(carrito.id, t)), avisos };
  });

/** Carrito de visitante (del navegador): mismos cálculos, sin guardar nada. */
export async function cotizar(items) {
  const datos = await datosVariantes(items.map((i) => i.variante_id));
  return armarCarrito(items.map((i) => armarLinea(i, datos.get(i.variante_id))));
}
