import { CarritoDistribuidora, CarritoDistribuidoraItem, ProductoDistribuidora, VariedadDistribuidora, CategoriaDistribuidora } from "../../models/index.js";

/**
 * Contrato de cada item devuelto — mismo shape que carrito_service.js
 * (indumentaria) para que el frontend pueda usar la misma lógica de
 * detección de alertas (cart_staleness.js), aunque acá vive en un contexto
 * propio (modules/eccomerce_distribuidora/carrito/), no en controls/carrito/:
 *
 *   activo, variante_disponible, variante, precio, precio_al_agregar,
 *   stock_disponible, cantidad, item_id, producto_id, nombre, categoria, imagen
 */

async function obtenerOCrearCarrito(usuario_id) {
  const [carrito] = await CarritoDistribuidora.findOrCreate({
    where: { usuario_id },
    defaults: { usuario_id, fecha_alta: new Date(), fecha_mod: new Date() },
  });
  return carrito;
}

function mapearItem(item) {
  const producto = item.producto;
  const variedad = item.variedad; // VariedadDistribuidora, alias definido en models/index.js

  // null = "sin control de stock acá" — cart_validators.js/cart_staleness.js
  // (controls/carrito/) ya interpretan null como "no bloquear, no avisar".
  const stockDisponible = variedad?.controla_stock ? variedad.cantidad : null;
  const variedadEliminada = item.variedad_id != null && !variedad;

  return {
    item_id: item.id,
    producto_id: item.producto_id,
    nombre: producto?.nombre ?? "(producto eliminado)",
    categoria: producto?.categoria?.nombre ?? null,
    imagen: producto?.imagen_url ?? null,
    variante: variedad?.nombre ?? null,
    variante_disponible: !variedadEliminada,
    precio: variedad ? Number(variedad.precio) : Number(item.precio_unidad),
    precio_al_agregar: Number(item.precio_unidad),
    stock_disponible: stockDisponible,
    cantidad: item.cantidad,
    activo: !!producto && producto.activo && !producto.fecha_baja,
  };
}

async function listarItemsCarrito(carrito_id) {
  const items = await CarritoDistribuidoraItem.findAll({
    where: { carrito_id },
    include: [
      {
        model: ProductoDistribuidora, as: "producto", required: false,
        attributes: ["id", "nombre", "activo", "fecha_baja", "imagen_url"],
        include: [{ model: CategoriaDistribuidora, as: "categoria", attributes: ["nombre"] }],
      },
      {
        model: VariedadDistribuidora, as: "variedad", required: false,
        attributes: ["id", "nombre", "precio", "controla_stock", "cantidad"],
      },
    ],
    order: [["fecha_alta", "ASC"]],
  });

  return items.map(mapearItem);
}

export async function obtenerCarrito(usuario_id) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  return listarItemsCarrito(carrito.id);
}

export async function agregarItem(usuario_id, { producto_id, variedad_id = null, cantidad = 1 }) {
  const producto = await ProductoDistribuidora.findOne({ where: { id: producto_id, activo: true, fecha_baja: null } });
  if (!producto) throw Object.assign(new Error("Producto no disponible"), { status: 404 });

  let variedad = null;
  if (variedad_id) {
    variedad = await VariedadDistribuidora.findOne({ where: { id: variedad_id, producto_id, fecha_baja: null } });
    if (!variedad) throw Object.assign(new Error("Variedad no disponible"), { status: 404 });
  } else {
    // Sin variedad explícita — el producto necesita tener exactamente una
    // (el caso "sin variedades reales", nombre null) para poder agregarse así.
    variedad = await VariedadDistribuidora.findOne({ where: { producto_id, nombre: null, fecha_baja: null } });
    if (!variedad) throw Object.assign(new Error("Este producto requiere elegir una variedad"), { status: 400 });
  }

  const carrito = await obtenerOCrearCarrito(usuario_id);

  const existente = await CarritoDistribuidoraItem.findOne({
    where: { carrito_id: carrito.id, producto_id, variedad_id: variedad.id },
  });

  if (existente) {
    await existente.update({ cantidad: existente.cantidad + cantidad, precio_unidad: variedad.precio });
  } else {
    await CarritoDistribuidoraItem.create({
      carrito_id: carrito.id,
      producto_id,
      variedad_id: variedad.id,
      cantidad,
      precio_unidad: variedad.precio,
      fecha_alta: new Date(),
    });
  }

  await carrito.update({ fecha_mod: new Date() });
  return listarItemsCarrito(carrito.id);
}

export async function actualizarCantidad(usuario_id, item_id, cantidad) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  const item = await CarritoDistribuidoraItem.findOne({ where: { id: item_id, carrito_id: carrito.id } });
  if (!item) throw Object.assign(new Error("Item no encontrado en el carrito"), { status: 404 });

  await item.update({ cantidad });
  await carrito.update({ fecha_mod: new Date() });
  return listarItemsCarrito(carrito.id);
}

export async function eliminarItem(usuario_id, item_id) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  await CarritoDistribuidoraItem.destroy({ where: { id: item_id, carrito_id: carrito.id } });
  await carrito.update({ fecha_mod: new Date() });
  return listarItemsCarrito(carrito.id);
}

export async function vaciarCarrito(usuario_id) {
  const carrito = await obtenerOCrearCarrito(usuario_id);
  await CarritoDistribuidoraItem.destroy({ where: { carrito_id: carrito.id } });
  await carrito.update({ fecha_mod: new Date() });
}

// Usado por nota_pedido_service.js — expone el carrito "crudo" (con la fila
// CarritoDistribuidora) para poder snapshotearlo y vaciarlo en la misma operación.
export { obtenerOCrearCarrito, listarItemsCarrito };
