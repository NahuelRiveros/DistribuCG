import {
  obtenerRecaudacionMesesPorAnio,
  obtenerRecaudacionDiasDeMes,
  obtenerDetalleRecaudacionDia,
} from "../services/recaudacion_service.js";

function parseIntSafe(v) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET /recaudacion/mensual?anio=2026
 */
export async function RecaudacionMesesPorAnio(req, res) {
  try {
    const anio = parseIntSafe(req.query.anio);

    if (!anio) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "anio es obligatorio",
      });
    }

    const data = await obtenerRecaudacionMesesPorAnio({ anio });

    return res.json({
      ok: true,
      anio,
      ...data,
    });
  } catch (error) {
    console.error("RecaudacionMesesPorAnio:", error);

    return res.status(500).json({
      ok: false,
      codigo: "ERROR_RECAUDACION_MESES",
      mensaje: "No se pudo obtener la recaudación por meses",
    });
  }
}

/**
 * GET /recaudacion/dias?anio=2026&mes=3
 */
export async function RecaudacionDiasDeMes(req, res) {
  try {
    const anio = parseIntSafe(req.query.anio);
    const mes = parseIntSafe(req.query.mes);

    if (!anio || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "anio y mes son obligatorios (mes 1..12)",
      });
    }

    const data = await obtenerRecaudacionDiasDeMes({ anio, mes });

    return res.json({
      ok: true,
      anio,
      mes,
      ...data,
    });
  } catch (error) {
    console.error("RecaudacionDiasDeMes:", error);

    return res.status(500).json({
      ok: false,
      codigo: "ERROR_RECAUDACION_DIAS",
      mensaje: "No se pudo obtener la recaudación diaria del mes",
    });
  }
}

/**
 * GET /recaudacion/detalle-dia?anio=2026&mes=3&dia=20
 */
export async function RecaudacionDetalleDia(req, res) {
  try {
    const anio = parseIntSafe(req.query.anio);
    const mes = parseIntSafe(req.query.mes);
    const dia = parseIntSafe(req.query.dia);

    if (!anio || !mes || !dia || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "anio, mes y dia son obligatorios",
      });
    }

    const data = await obtenerDetalleRecaudacionDia({ anio, mes, dia });
    
    return res.json({
      ok: true,
      anio,
      mes,
      dia,
      ...data,
    });
  } catch (error) {
    console.error("RecaudacionDetalleDia:", error);

    return res.status(500).json({
      ok: false,
      codigo: "ERROR_RECAUDACION_DETALLE_DIA",
      mensaje: "No se pudo obtener el detalle de recaudación del día",
    });
  }
}