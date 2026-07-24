import {
  listarAreas,
  obtenerContenidoPublico,
  listarContenidoAdmin,
  crearContenido,
  actualizarContenido,
  cambiarEstadoContenido,
  eliminarContenido,
} from "../services/home_service.js";

export async function listarAreasController(_req, res) {
  try {
    const areas = await listarAreas();
    return res.json({ ok: true, data: areas });
  } catch (error) {
    console.error("Error al listar áreas del home:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar áreas" });
  }
}

export async function obtenerContenidoPublicoController(_req, res) {
  try {
    const data = await obtenerContenidoPublico();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error al obtener contenido del home:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener contenido del home" });
  }
}

export async function listarContenidoAdminController(req, res) {
  try {
    const area_id = req.query.area_id ? Number(req.query.area_id) : undefined;
    const data = await listarContenidoAdmin({ area_id });
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error al listar contenido del home (admin):", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar contenido" });
  }
}

export async function crearContenidoController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: "Falta el archivo a subir" });
    }

    const resultado = await crearContenido({
      area_id: Number(req.body.area_id),
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      orden: req.body.orden,
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
    });

    if (!resultado.ok) {
      const status = resultado.codigo === "AREA_NO_EXISTE" ? 404 : 400;
      return res.status(status).json(resultado);
    }

    return res.status(201).json(resultado);
  } catch (error) {
    console.error("Error al crear contenido del home:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al subir el contenido" });
  }
}

export async function actualizarContenidoController(req, res) {
  try {
    const contenido = await actualizarContenido(req.params.id, req.body);
    if (!contenido) return res.status(404).json({ ok: false, mensaje: "Contenido no encontrado" });
    return res.json({ ok: true, mensaje: "Contenido actualizado correctamente", data: contenido });
  } catch (error) {
    console.error("Error al actualizar contenido del home:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el contenido" });
  }
}

export async function cambiarEstadoContenidoController(req, res) {
  try {
    const { activo } = req.body;
    if (typeof activo !== "boolean") {
      return res.status(400).json({ ok: false, mensaje: "El campo activo debe ser booleano" });
    }
    const contenido = await cambiarEstadoContenido(req.params.id, activo);
    if (!contenido) return res.status(404).json({ ok: false, mensaje: "Contenido no encontrado" });
    return res.json({
      ok: true,
      mensaje: activo ? "Contenido activado correctamente" : "Contenido desactivado correctamente",
      data: contenido,
    });
  } catch (error) {
    console.error("Error al cambiar estado del contenido del home:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al cambiar estado" });
  }
}

export async function eliminarContenidoController(req, res) {
  try {
    const eliminado = await eliminarContenido(req.params.id);
    if (!eliminado) return res.status(404).json({ ok: false, mensaje: "Contenido no encontrado" });
    return res.json({ ok: true, mensaje: "Contenido eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar contenido del home:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar el contenido" });
  }
}
