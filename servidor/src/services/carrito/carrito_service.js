import { Carrito, CarritoItem, ProductoTienda, Stock, Talle, Color, Categoria } from "../../models/index.js";

/**
 * Contrato de cada item devuelto — lo consume el frontend
 * (modules/eccomerce_indumentaria/carrito/validations/cart_staleness.js):
 *
 *   activo, variante_disponible, variante, precio, precio_al_agregar,
 *   stock_disponible, cantidad, item_id, producto_id, nombre, categoria, imagen
 */

async function obtenerOCrearCarrito(usuario_id) {
  const [carrito] = await Carrito.findOrCreate({
    where: { usuario_id },
    defaults: { usuario_id, fecha_alta: new Date(), fecha_mod: new Date() },
  });
  return carrito;
}

async function mapearItem(item) {
  const producto = item.producto;
  const variante = item.variante; // Stock, alias definido en models/index.js

  const partesVariante = variante ? [variante.talle?.nombre, variante.color?.nombre].filter(Boolean) : [];
  const stockDisponible = variante ? variante.cantidad : null;
  const varianteEliminada = item.stock_id != null && !variante;

  return {
    item_id: item.id,
    producto_id: item.producto_id,
    nombre: producto?.nombre ?? "(producto eliminado)",
    categoria: producto?.categoria?.nombre ?? null,
    imagen: producto?.imagenes?.[0] ?? null,
    variante: partesVariante.length > 0 ? partesVariante.join(" / ") : null,
    variante_disponible: !varianteEliminada,
    precio: producto ? Number(producto.precio) : Number(item.precio_unidad),
    precio_al_agregar: Number(item.precio_unidad),
    stock_disponible: stockDisponible,
    cantidad: item.cantidad,
    activo: !!producto && producto.activo && !producto.fecha_baja,
  };
}

async function listarItemsCarrito(carrito_id) {
  const items = await CarritoItem.findAll({
    where: { carrito_id },
    include: [
      {
        model: ProductoTienda, as: "producto", required: false,
        attributes: ["id", "nombre", "precio", "activo", "fecha_baja", "imagenes"],
        include: [{ model: Categoria, as: "categoria", attributes: ["nombre"] }],
      },
      {
        model: Stock, as: "variante", required: false,
        attributes: ["id", "cantidad"],
        include: [
          { model: Talle, as: "talle", attributes: ["nombre"] },
          { model: Color, as: "color", attributes: ["nombre"] },
        ],
      },
    ],
    order: [["fecha_alta", "ASC"]],
  });

  return Promise.all(items.map(mapearItem));
}

export async function obtenerCarrito(usuario_id) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  return listarItemsCarrito(carrito.id);
}

export async function agregarItem(usuario_id, { producto_id, variante_id = null, cantidad = 1 }) {
  const producto = await ProductoTienda.findOne({ where: { id: producto_id, activo: true, fecha_baja: null } });
  if (!producto) throw Object.assign(new Error("Producto no disponible"), { status: 404 });

  if (variante_id) {
    const stock = await Stock.findOne({ where: { id: variante_id, producto_id, fecha_baja: null } });
    if (!stock) throw Object.assign(new Error("Variante no disponible"), { status: 404 });
  }

  const carrito = await obtenerOCrearCarrito(usuario_id);

  const existente = await CarritoItem.findOne({
    where: { carrito_id: carrito.id, producto_id, stock_id: variante_id },
  });

  if (existente) {
    await existente.update({ cantidad: existente.cantidad + cantidad, precio_unidad: producto.precio });
  } else {
    await CarritoItem.create({
      carrito_id: carrito.id,
      producto_id,
      stock_id: variante_id,
      cantidad,
      precio_unidad: producto.precio,
      fecha_alta: new Date(),
    });
  }

  await carrito.update({ fecha_mod: new Date() });
  return listarItemsCarrito(carrito.id);
}

export async function actualizarCantidad(usuario_id, item_id, cantidad) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  const item = await CarritoItem.findOne({ where: { id: item_id, carrito_id: carrito.id } });
  if (!item) throw Object.assign(new Error("Item no encontrado en el carrito"), { status: 404 });

  await item.update({ cantidad });
  await carrito.update({ fecha_mod: new Date() });
  return listarItemsCarrito(carrito.id);
}

export async function eliminarItem(usuario_id, item_id) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  await CarritoItem.destroy({ where: { id: item_id, carrito_id: carrito.id } });
  await carrito.update({ fecha_mod: new Date() });
  return listarItemsCarrito(carrito.id);
}

export async function vaciarCarrito(usuario_id) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  await CarritoItem.destroy({ where: { carrito_id: carrito.id } });
  await carrito.update({ fecha_mod: new Date() });
}
