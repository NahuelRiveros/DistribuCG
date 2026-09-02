import {
  listarProductos, obtenerProductoPorId, obtenerOfertasDestacadas,
  crearProducto, actualizarProducto, obtenerStockBajo,
  generarCatalogoCSV, importarCatalogoCSV,
} from "../../services/productos/producto_service.js";

export async function listarProductosController(req, res) {
  try {
    const { productos, pagination } = await listarProductos(req.query);
    return res.json({ ok: true, data: productos, total: pagination.total, pagina: pagination.page, total_paginas: pagination.totalPages });
  } catch (error) {
    console.error("Error al listar productos:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar productos" });
  }
}

export async function obtenerOfertasDestacadasController(req, res) {
  try {
    return res.json({ ok: true, data: await obtenerOfertasDestacadas() });
  } catch (error) {
    console.error("Error al obtener ofertas destacadas:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener ofertas destacadas" });
  }
}

export async function obtenerStockBajoController(req, res) {
  try {
    const umbral = Number(req.query.umbral) || 1;
    return res.json({ ok: true, data: await obtenerStockBajo(umbral) });
  } catch (error) {
    console.error("Error al obtener stock bajo:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener el stock bajo" });
  }
}

export async function obtenerCatalogoCSVController(req, res) {
  try {
    return res.json({ ok: true, data: await generarCatalogoCSV() });
  } catch (error) {
    console.error("Error al generar CSV:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al generar el CSV" });
  }
}

export async function importarCatalogoCSVController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, mensaje: "No se recibió ningún archivo CSV" });
    const resultado = await importarCatalogoCSV(req.file.buffer.toString("utf-8"));
    return res.json({
      ok: true,
      mensaje: `Importación completa: ${resultado.creados} creado(s), ${resultado.actualizados} actualizado(s)${resultado.errores.length ? `, ${resultado.errores.length} error(es)` : ""}`,
      data: resultado,
    });
  } catch (error) {
    console.error("Error al importar CSV:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al importar el CSV" });
  }
}

export async function obtenerProductoController(req, res) {
  try {
    const producto = await obtenerProductoPorId(req.params.id);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    return res.json({ ok: true, data: producto });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener el producto" });
  }
}

export async function crearProductoController(req, res) {
  try {
    const { categoria_id, nombre, precio } = req.body;
    if (!categoria_id || !nombre?.trim() || precio === undefined) {
      return res.status(400).json({ ok: false, mensaje: "categoria_id, nombre y precio son requeridos" });
    }
    const producto = await crearProducto(req.body);
    return res.status(201).json({ ok: true, mensaje: "Producto creado correctamente", data: producto });
  } catch (error) {
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
    console.error("Error al actualizar producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el producto" });
  }
}
