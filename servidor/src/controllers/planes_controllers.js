import {
  listarPlanes,
  obtenerPlanPorId,
  crearPlan,
  actualizarPlan,
  existePlanConDescripcion,
  planEstaUsado,
  cambiarEstadoPlan,
} from "../services/planes_services.js";
import { validarPlanBody } from "../validator/planes_validators.js";

export async function listarPlanesController(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos !== "false";
    const planes = await listarPlanes({ incluirInactivos });
    return res.json({
      ok: true,
      data: planes,
    });
  } catch (error) {
    console.error("Error al listar planes:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al listar planes",
    });
  }
}

export async function obtenerPlanPorIdController(req, res) {
  try {
    const { id } = req.params;
    const plan = await obtenerPlanPorId(id);

    if (!plan) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plan no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error al obtener plan:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al obtener plan",
    });
  }
}

export async function crearPlanController(req, res) {
  try {
    const validacion = validarPlanBody(req.body);

    if (!validacion.esValido) {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos inválidos",
        errores: validacion.errores,
      });
    }

    const yaExiste = await existePlanConDescripcion(validacion.valores.descripcion);

    if (yaExiste) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe un plan con esa descripción",
      });
    }

    const nuevoPlan = await crearPlan(validacion.valores);

    return res.status(201).json({
      ok: true,
      mensaje: "Plan creado correctamente",
      data: nuevoPlan,
    });
  } catch (error) {
    console.error("Error al crear plan:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al crear plan",
    });
  }
}

export async function actualizarPlanController(req, res) {
  try {
    const { id } = req.params;

    const validacion = validarPlanBody(req.body);

    if (!validacion.esValido) {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos inválidos",
        errores: validacion.errores,
      });
    }

    const planExistente = await obtenerPlanPorId(id);

    if (!planExistente) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plan no encontrado",
      });
    }

    const descripcionDuplicada = await existePlanConDescripcion(
      validacion.valores.descripcion,
      id
    );

    if (descripcionDuplicada) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe otro plan con esa descripción",
      });
    }

    const planActualizado = await actualizarPlan(id, validacion.valores);

    return res.json({
      ok: true,
      mensaje: "Plan actualizado correctamente",
      data: planActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar plan:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al actualizar plan",
    });
  }
}

export async function cambiarEstadoPlanController(req, res) {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        ok: false,
        mensaje: "El campo activo debe ser booleano",
      });
    }

    const plan = await obtenerPlanPorId(id);

    if (!plan) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plan no encontrado",
      });
    }

    if (activo === false) {
      const usado = await planEstaUsado(id);

      if (usado) {
        const actualizado = await cambiarEstadoPlan(id, false);

        return res.json({
          ok: true,
          mensaje: "El plan está en uso, por eso se desactivó en lugar de borrarse",
          data: actualizado,
        });
      }
    }

    const actualizado = await cambiarEstadoPlan(id, activo);

    return res.json({
      ok: true,
      mensaje: activo
        ? "Plan activado correctamente"
        : "Plan desactivado correctamente",
      data: actualizado,
    });
  } catch (error) {
    console.error("Error al cambiar estado del plan:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al cambiar estado del plan",
    });
  }
}