import {
  getSuscripcionEstado,
  activarSuscripcion,
  eliminarSuscripcion,
  registrarLog,
  getHistorial,
  diasHastaVencimiento,
  getSuscripcion,
} from "../services/suscripcion_service.js";
import { invalidarCacheSuscripcion } from "../middleware/suscripcion_middleware.js";

// GET /api/admin/suscripcion
export async function estadoSuscripcionController(req, res) {
  try {
    const { estado, suscripcion, diasRestantesGracia } = await getSuscripcionEstado();

    return res.json({
      ok: true,
      data: {
        estado,
        diasRestantesGracia,
        dias_restantes:  diasHastaVencimiento(suscripcion),
        fecha_inicio:    suscripcion?.AUTH06_FECHA_INICIO  ?? null,
        fecha_fin:       suscripcion?.AUTH06_FECHA_FIN      ?? null,
        renovaciones:    suscripcion?.AUTH06_RENOVACIONES   ?? 0,
        dias_gracia:     suscripcion?.AUTH06_DIAS_GRACIA    ?? 10,
        notas:           suscripcion?.AUTH06_NOTAS          ?? null,
      },
    });
  } catch (error) {
    console.error("estadoSuscripcionController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener estado de suscripción" });
  }
}

// POST /api/admin/suscripcion/activar
// Body: { dias: 30, notas?: "..." }
export async function activarSuscripcionController(req, res) {
  try {
    const { dias, notas } = req.body ?? {};
    const result = await activarSuscripcion({ dias, notas, emailSadm: req.user.email });

    if (!result.ok) return res.status(400).json(result);

    invalidarCacheSuscripcion();
    return res.json(result);
  } catch (error) {
    console.error("activarSuscripcionController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al activar la suscripción" });
  }
}

// PUT /api/admin/suscripcion/gracia
// Body: { dias_gracia: 10 }
export async function actualizarGraciaController(req, res) {
  try {
    const diasGracia = Number(req.body?.dias_gracia);

    if (!Number.isInteger(diasGracia) || diasGracia < 1 || diasGracia > 28) {
      return res.status(400).json({
        ok: false,
        mensaje: "dias_gracia debe ser un entero entre 1 y 28",
      });
    }

    const suscripcion = await getSuscripcion();

    if (!suscripcion) {
      return res.status(404).json({ ok: false, mensaje: "No existe suscripción. Activá primero." });
    }

    await suscripcion.update({ AUTH06_DIAS_GRACIA: diasGracia });
    invalidarCacheSuscripcion();

    await registrarLog({ accion: "GRACIA", notas: `Días de gracia actualizados a ${diasGracia}`, emailSadm: req.user.email });

    return res.json({
      ok: true,
      mensaje: `Período de gracia actualizado a ${diasGracia} día(s) por mes`,
    });
  } catch (error) {
    console.error("actualizarGraciaController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al actualizar período de gracia" });
  }
}

// DELETE /api/admin/suscripcion
export async function eliminarSuscripcionController(req, res) {
  try {
    await registrarLog({ accion: "ELIMINAR", notas: "Suscripción eliminada manualmente", emailSadm: req.user.email });
    const result = await eliminarSuscripcion();
    invalidarCacheSuscripcion();
    return res.json(result);
  } catch (error) {
    console.error("eliminarSuscripcionController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al eliminar la suscripción" });
  }
}

// GET /api/admin/suscripcion/historial
export async function historialController(_req, res) {
  try {
    const historial = await getHistorial();
    return res.json({
      ok: true,
      data: historial.map((h) => ({
        id:              h.ID_AUTH07,
        accion:          h.AUTH07_ACCION,
        dias:            h.AUTH07_DIAS,
        fecha_fin_result: h.AUTH07_FECHA_FIN_RESULT,
        notas:           h.AUTH07_NOTAS,
        email:           h.AUTH07_EMAIL,
        fecha:           h.AUTH07_FECHA,
      })),
    });
  } catch (error) {
    console.error("historialController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener historial" });
  }
}
