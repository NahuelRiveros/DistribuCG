import {
  listarProductos, obtenerProductoPorId, crearProducto, actualizarProducto, cambiarEstadoProducto, eliminarProducto,
  crearVariedad, actualizarVariedad, eliminarVariedad, ajustarPreciosMasivo,
} from "../../services/distribuidora/producto_distribuidora_service.js";

// admin/staff gestionan el catálogo y necesitan seguir viendo los productos
// desactivados (para poder reactivarlos); cualquier otro rol ve solo lo activo.
function puedeVerInactivos(req) {
  const roles = req.user?.roles ?? [];
  return roles.includes("admin") || roles.includes("staff");
}

export async function listarProductosController(req, res) {
  try {
    // req.query siempre trae strings — "false" es truthy en JS, hay que
    // convertirlo a booleano posta antes de pasarlo al service.
    const { productos, pagination } = await listarProductos({
      ...req.query,
      incluirDescendientes: req.query.incluirDescendientes !== "false",
      soloActivos: !puedeVerInactivos(req),
    });
    return res.json({ ok: true, data: productos, total: pagination.total, pagina: pagination.page, total_paginas: pagination.totalPages });
  } catch (error) {
    console.error("Error al listar productos:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar productos" });
  }
}

export async function obtenerProductoController(req, res) {
  try {
    const producto = await obtenerProductoPorId(req.params.id, { soloActivos: !puedeVerInactivos(req) });
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    return res.json({ ok: true, data: producto });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener el producto" });
  }
}

export async function crearProductoController(req, res) {
  try {
    const { categoria_id, nombre } = req.body;
    if (!categoria_id || !nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "categoria_id y nombre son requeridos" });
    }
    const producto = await crearProducto(req.body);
    return res.status(201).json({ ok: true, mensaje: "Producto creado correctamente", data: producto });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un producto con ese nombre en esta categoría" });
    }
    console.error("Error al crear producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear el producto" });
  }
}

export async function actualizarProductoController(req, res) {
  try {
    const producto = await actualizarProducto(req.params.id, req.body);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    return res.json({ ok: true, mensaje: "Producto actualizado correctamente", data: producto });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un producto con ese nombre en esta categoría" });
    }
    console.error("Error al actualizar producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el producto" });
  }
}

export async function cambiarEstadoProductoController(req, res) {
  try {
    const { activo } = req.body ?? {};
    if (typeof activo !== "boolean") return res.status(400).json({ ok: false, mensaje: "activo debe ser true o false" });
    const producto = await cambiarEstadoProducto(req.params.id, activo);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    return res.json({ ok: true, mensaje: activo ? "Producto activado" : "Producto desactivado", data: producto });
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al cambiar el estado" });
  }
}

export async function eliminarProductoController(req, res) {
  try {
    const producto = await eliminarProducto(req.params.id);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    return res.json({ ok: true, mensaje: "Producto eliminado correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar el producto" });
  }
}

export async function ajustarPreciosMasivoController(req, res) {
  try {
    const { porcentaje, producto_id, categoria_id, confirmarTodoElCatalogo } = req.body ?? {};
    if (porcentaje === undefined || porcentaje === null || Number.isNaN(Number(porcentaje))) {
      return res.status(400).json({ ok: false, mensaje: "porcentaje es requerido" });
    }
    if (!producto_id && !categoria_id && !confirmarTodoElCatalogo) {
      return res.status(400).json({ ok: false, mensaje: "Falta confirmar que el ajuste aplica a todo el catálogo" });
    }
    const cantidad = await ajustarPreciosMasivo({ porcentaje, producto_id, categoria_id });
    return res.json({ ok: true, mensaje: `${cantidad} variedad(es) actualizada(s)`, data: { cantidad } });
  } catch (error) {
    console.error("Error al ajustar precios masivamente:", error);
    return res.status(error.status ?? 500).json({ ok: false, mensaje: error.status ? error.message : "Error interno al ajustar los precios" });
  }
}

// ── Variedades ───────────────────────────────────────────────────────────

export async function crearVariedadController(req, res) {
  try {
    const { precio } = req.body;
    if (precio === undefined) return res.status(400).json({ ok: false, mensaje: "precio es requerido" });
    const variedad = await crearVariedad(req.params.productoId, req.body);
    return res.status(201).json({ ok: true, mensaje: "Variedad creada correctamente", data: variedad });
  } catch (error) {
    console.error("Error al crear variedad:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear la variedad" });
  }
}

export async function actualizarVariedadController(req, res) {
  try {
    const { precio } = req.body;
    if (precio === undefined) return res.status(400).json({ ok: false, mensaje: "precio es requerido" });
    const variedad = await actualizarVariedad(req.params.id, req.body);
    if (!variedad) return res.status(404).json({ ok: false, mensaje: "Variedad no encontrada" });
    return res.json({ ok: true, mensaje: "Variedad actualizada correctamente", data: variedad });
  } catch (error) {
    console.error("Error al actualizar variedad:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar la variedad" });
  }
}

export async function eliminarVariedadController(req, res) {
  try {
    const variedad = await eliminarVariedad(req.params.id);
    if (!variedad) return res.status(404).json({ ok: false, mensaje: "Variedad no encontrada" });
    return res.json({ ok: true, mensaje: "Variedad eliminada correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar variedad:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar la variedad" });
  }
}
