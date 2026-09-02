import {
  obtenerCarrito, agregarItem, actualizarCantidad, eliminarItem, vaciarCarrito,
} from "../../services/distribuidora/carrito_distribuidora_service.js";

export async function obtenerCarritoController(req, res) {
  try {
    return res.json({ ok: true, data: await obtenerCarrito(req.user.usuario_id) });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener el carrito" });
  }
}

export async function agregarItemController(req, res) {
  try {
    const { producto_id, variedad_id, cantidad } = req.body;
    if (!producto_id || !cantidad) {
      return res.status(400).json({ ok: false, mensaje: "producto_id y cantidad son requeridos" });
    }
    const data = await agregarItem(req.user.usuario_id, { producto_id, variedad_id, cantidad });
    return res.status(201).json({ ok: true, mensaje: "Producto agregado al pedido", data });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    return res.status(error.status ?? 500).json({ ok: false, mensaje: error.status ? error.message : "Error interno al agregar el producto" });
  }
}

export async function actualizarCantidadController(req, res) {
  try {
    const { cantidad } = req.body;
    if (!cantidad || cantidad < 1) {
      return res.status(400).json({ ok: false, mensaje: "cantidad debe ser mayor a 0" });
    }
    const data = await actualizarCantidad(req.user.usuario_id, req.params.itemId, cantidad);
    return res.json({ ok: true, mensaje: "Cantidad actualizada", data });
  } catch (error) {
    console.error("Error al actualizar cantidad:", error);
    return res.status(error.status ?? 500).json({ ok: false, mensaje: error.status ? error.message : "Error interno al actualizar la cantidad" });
  }
}

export async function eliminarItemController(req, res) {
  try {
    const data = await eliminarItem(req.user.usuario_id, req.params.itemId);
    return res.json({ ok: true, mensaje: "Producto eliminado del pedido", data });
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar el producto" });
  }
}

export async function vaciarCarritoController(req, res) {
  try {
    await vaciarCarrito(req.user.usuario_id);
    return res.json({ ok: true, mensaje: "Pedido vaciado", data: null });
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al vaciar el pedido" });
  }
}
