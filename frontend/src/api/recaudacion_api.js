import { http } from "./http";

/**
 * GET /recaudacion/mensual?anio=2026
 */
export async function getRecaudacionMensualPorAnio(anio) {
  const r = await http.get("/recaudacion/mensual", {
    params: { anio },
  });
  return r.data;
}

/**
 * GET /recaudacion/dias?anio=2026&mes=3
 */
export async function getRecaudacionDiasDeMes(anio, mes) {
  const r = await http.get("/recaudacion/dias", {
    params: { anio, mes },
  });
  return r.data;
}

/**
 * GET /recaudacion/detalle-dia?anio=2026&mes=3&dia=20
 */
export async function getRecaudacionDetalleDia(anio, mes, dia) {
  const r = await http.get("/recaudacion/detalle-dia", {
    params: { anio, mes, dia },
  });
  return r.data;
}