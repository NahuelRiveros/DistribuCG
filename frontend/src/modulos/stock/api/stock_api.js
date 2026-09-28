import { http } from "@/api/http.js";

const limpiar = (filtros = {}) => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));

export async function listarExistencias(filtros) {
  const { data } = await http.get("/stock/existencias", { params: limpiar(filtros) });
  return { existencias: data.data, paginacion: data.paginacion };
}
export const resumenStock = async () => (await http.get("/stock/resumen")).data.data;
export const configurarStock = async ({ variante_id, ...datos }) => (await http.patch(`/stock/variantes/${variante_id}`, datos)).data.data;
export const registrarIngreso = async (datos) => (await http.post("/stock/ingresos", datos)).data.data;
export const registrarAjuste = async (datos) => (await http.post("/stock/ajustes", datos)).data.data;
export async function historial(variante_id, filtros) {
  const { data } = await http.get(`/stock/variantes/${variante_id}/movimientos`, { params: limpiar(filtros) });
  return { existencia: data.existencia, movimientos: data.data, paginacion: data.paginacion };
}
export const conciliacion = async () => (await http.get("/stock/conciliacion")).data.data;
