import { http } from "./http";

export async function getEstadoModulos() {
  const r = await http.get("/modulos/estado");
  return r.data;
}

export async function getModulosNegocio() {
  const r = await http.get("/modulos");
  return r.data;
}

export async function actualizarModuloNegocio(codigo, habilitado) {
  const r = await http.patch(`/modulos/${codigo}/estado`, { habilitado });
  return r.data;
}
