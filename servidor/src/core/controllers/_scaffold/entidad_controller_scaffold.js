/**
 * PLANTILLA — controller CRUD, delgado: valida lo mínimo, llama al service,
 * devuelve siempre `{ ok, data?, mensaje }`. Ver
 * controllers/productos/catalogos_controller.js (funciones de Talle) para
 * un ejemplo real ya funcionando.
 *
 * No se importa desde ningún lado — punto de partida para copiar.
 *
 * Cómo usarla:
 *   1. Copiá a `controllers/<dominio>/mi_entidad_controller.js`.
 *   2. Cambiá el import por tu service real y reemplazá "Entidad".
 *   3. Ajustá la validación de campos requeridos y los mensajes.
 */

import {
  listarEntidades, crearEntidad, actualizarEntidad, eliminarEntidad,
} from "../../services/_scaffold/entidad_service_scaffold.js"; // TODO: service real

export async function listarEntidadesController(req, res) {
  try {
    return res.json({ ok: true, data: await listarEntidades() });
  } catch (error) {
    console.error("Error al listar entidades:", error); // TODO: nombre real en el log
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar entidades" });
  }
}

export async function crearEntidadController(req, res) {
  try {
    const { nombre, orden } = req.body; // TODO: campos reales
    if (!nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "nombre es requerido" });
    }
    const entidad = await crearEntidad({ nombre: nombre.trim(), orden });
    return res.status(201).json({ ok: true, mensaje: "Entidad creada correctamente", data: entidad });
  } catch (error) {
    console.error("Error al crear entidad:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear la entidad" });
  }
}

export async function actualizarEntidadController(req, res) {
  try {
    const { nombre, orden } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "nombre es requerido" });
    }
    const entidad = await actualizarEntidad(req.params.id, { nombre: nombre.trim(), orden });
    if (!entidad) return res.status(404).json({ ok: false, mensaje: "Entidad no encontrada" });
    return res.json({ ok: true, mensaje: "Entidad actualizada correctamente", data: entidad });
  } catch (error) {
    console.error("Error al actualizar entidad:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar la entidad" });
  }
}

export async function eliminarEntidadController(req, res) {
  try {
    const entidad = await eliminarEntidad(req.params.id);
    if (!entidad) return res.status(404).json({ ok: false, mensaje: "Entidad no encontrada" });
    return res.json({ ok: true, mensaje: "Entidad eliminada correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar entidad:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar la entidad" });
  }
}

// TODO: si la entidad necesita GET por id, agregar acá + en el router:
// export async function obtenerEntidadController(req, res) { ... }
