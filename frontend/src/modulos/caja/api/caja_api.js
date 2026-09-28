import { http } from "@/api/http.js";

const datos = (r) => r.data.data;
const limpiar = (filtros = {}) => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// Caja (/api/caja, solo admin).
export const balanceAnual = async (anio) => datos(await http.get("/caja/anual", { params: limpiar({ anio }) }));
export const balanceMes = async ({ anio, mes }) => datos(await http.get("/caja/mes", { params: { anio, mes } }));

export async function listarMovimientos(filtros) {
  const { data } = await http.get("/caja/movimientos", { params: limpiar(filtros) });
  return { movimientos: data.data, paginacion: data.paginacion };
}
export const crearMovimiento = async (movimiento) => datos(await http.post("/caja/movimientos", movimiento));
export const editarMovimiento = async ({ id, ...movimiento }) => datos(await http.patch(`/caja/movimientos/${id}`, movimiento));
export const anularMovimiento = async ({ id, motivo }) => datos(await http.post(`/caja/movimientos/${id}/anular`, { motivo }));

export const listarCategorias = async () => datos(await http.get("/caja/categorias"));
export const crearCategoria = async (categoria) => datos(await http.post("/caja/categorias", categoria));
export const editarCategoria = async ({ id, ...cambios }) => datos(await http.patch(`/caja/categorias/${id}`, cambios));

export const exportarAnio = async (anio) => (await http.get("/caja/exportar", { params: { anio }, responseType: "blob" })).data;
