import { http } from "@/api/http.js";

const datos = (r) => r.data.data;
const limpiar = (filtros = {}) => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// "Usuarios" del panel (/api/usuarios, solo admin).
export async function listarUsuarios(filtros) {
  const { data } = await http.get("/usuarios", { params: limpiar(filtros) });
  return { usuarios: data.data, paginacion: data.paginacion };
}
export const crearUsuario = async (usuario) => datos(await http.post("/usuarios", usuario));
export const editarUsuario = async ({ id, ...usuario }) => datos(await http.patch(`/usuarios/${id}`, usuario));
export const cambiarEstadoUsuario = async ({ id, activo }) => datos(await http.patch(`/usuarios/${id}/estado`, { activo }));
export const cambiarContrasenaUsuario = async ({ id, ...cuerpo }) => datos(await http.put(`/usuarios/${id}/contrasena`, cuerpo));
