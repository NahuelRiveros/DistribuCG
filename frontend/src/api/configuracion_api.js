import { http } from "./http.js";

const datos = (r) => r.data.data;

// Configuración editable desde el panel (hoy: pagos). Leerla es público.
export const obtenerPagos = async () => datos(await http.get("/configuracion/pagos"));
export const pagosParaEditar = async () => datos(await http.get("/configuracion/pagos/editar"));
export const guardarPagos = async ({ valor, version }) => datos(await http.put("/configuracion/pagos", { valor, version }));
