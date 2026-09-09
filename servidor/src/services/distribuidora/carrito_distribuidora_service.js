import { CarritoDistribuidora, CarritoDistribuidoraItem, ProductoDistribuidora, VariedadDistribuidora, CategoriaDistribuidora } from "../../models/index.js";
import { withCart, idempotent } from "./cart_transaction.js";
import { cartError, validQuantity } from "../common/cart_rules.js";
import { clientConfig } from "../../../../client_config.js";
export async function obtenerOCrearCarrito(usuario_id) {
  const [cart] = await CarritoDistribuidora.findOrCreate({ where: { usuario_id }, defaults: { usuario_id } });
  return cart;
}
export async function listarItemsCarrito(carrito_id, transaction) {
  const rows = await CarritoDistribuidoraItem.findAll({
    where: { carrito_id }, transaction,
    include: [
      { model: ProductoDistribuidora, as: "producto", required: false, include: [{ model: CategoriaDistribuidora, as: "categoria", attributes: ["nombre"] }] },
      { model: VariedadDistribuidora, as: "variedad", required: false },
    ], order: [["fecha_alta", "ASC"]],
  });
  return rows.map((item) => ({
    item_id: item.id, producto_id: item.producto_id, variedad_id: item.variedad_id,
    nombre: item.producto?.nombre ?? "Producto no disponible", categoria: item.producto?.categoria?.nombre ?? null,
    imagen: item.producto?.imagen_url ?? null, variante: item.variedad?.nombre ?? null,
    variante_disponible: !!item.variedad && !item.variedad.fecha_baja,
    precio: Number(item.variedad?.precio ?? item.precio_unidad), precio_al_agregar: Number(item.precio_unidad),
    stock_disponible: item.variedad?.controla_stock ? item.variedad.cantidad : null,
    cantidad: item.cantidad, activo: !!item.producto?.activo && !item.producto.fecha_baja,
  }));
}
export async function obtenerCarrito(usuario_id) { const cart = await obtenerOCrearCarrito(usuario_id); return listarItemsCarrito(cart.id); }
async function addToCart(cart, payload, t) {
  const { producto_id, variedad_id, cantidad } = payload;
  validQuantity(cantidad);
  const product = await ProductoDistribuidora.findOne({ where: { id: producto_id, activo: true, fecha_baja: null }, transaction: t });
  if (!product) throw cartError("Producto no disponible", 404);
  const variants = await VariedadDistribuidora.findAll({ where: { producto_id, fecha_baja: null, ...(variedad_id ? { id: variedad_id } : {}) }, transaction: t });
  if (variants.length !== 1) throw cartError("Elegí una presentación disponible");
  const variant = variants[0];
  const existing = await CarritoDistribuidoraItem.findOne({ where: { carrito_id: cart.id, variedad_id: variant.id }, transaction: t });
  const quantity = validQuantity((existing?.cantidad ?? 0) + cantidad, variant.controla_stock ? variant.cantidad : null);
  if (existing) await existing.update({ cantidad: quantity, precio_unidad: variant.precio }, { transaction: t });
  else {
    const count = await CarritoDistribuidoraItem.count({ where: { carrito_id: cart.id }, transaction: t });
    if (count >= clientConfig.distribuidora.maxCartLines) throw cartError("Alcanzaste el máximo de productos por pedido.");
    await CarritoDistribuidoraItem.create({ carrito_id: cart.id, producto_id, variedad_id: variant.id, cantidad: quantity, precio_unidad: variant.precio, fecha_alta: new Date() }, { transaction: t });
  }
  await cart.update({ fecha_mod: new Date() }, { transaction: t });
}
export async function agregarItem(usuario_id, payload) {
  return withCart(usuario_id, async (cart, t) => { await addToCart(cart, payload, t); return listarItemsCarrito(cart.id, t); });
}
export async function fusionarCarrito(usuario_id, { key, items }) {
  if (!clientConfig.distribuidora.guestCart || !Array.isArray(items) || items.length > clientConfig.distribuidora.maxCartLines) throw cartError("Carrito de visitante inválido");
  return withCart(usuario_id, async (cart, t) => {
    await idempotent(usuario_id, "merge:" + key, items, t, async () => {
      for (const item of items) await addToCart(cart, item, t);
      return { ok: true };
    });
    return listarItemsCarrito(cart.id, t);
  });
}
export async function actualizarCantidad(usuario_id, item_id, cantidad) {
  return withCart(usuario_id, async (cart, t) => {
    const item = await CarritoDistribuidoraItem.findOne({ where: { id: item_id, carrito_id: cart.id }, transaction: t });
    if (!item) throw cartError("Producto no encontrado en tu carrito", 404);
    const variant = await VariedadDistribuidora.findOne({ where: { id: item.variedad_id, fecha_baja: null }, transaction: t });
    if (!variant) throw cartError("La presentación ya no está disponible", 409);
    validQuantity(cantidad, variant.controla_stock ? variant.cantidad : null);
    await item.update({ cantidad }, { transaction: t });
    return listarItemsCarrito(cart.id, t);
  });
}
export async function eliminarItem(usuario_id, item_id) {
  return withCart(usuario_id, async (cart, t) => {
    await CarritoDistribuidoraItem.destroy({ where: { id: item_id, carrito_id: cart.id }, transaction: t });
    return listarItemsCarrito(cart.id, t);
  });
}
export async function vaciarCarrito(usuario_id) {
  return withCart(usuario_id, async (cart, t) => { await CarritoDistribuidoraItem.destroy({ where: { carrito_id: cart.id }, transaction: t }); });
}
