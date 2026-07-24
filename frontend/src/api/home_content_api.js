import { http } from "./http";

// PÚBLICO — contenido activo agrupado por área, para la landing page
export async function obtenerContenidoHomePublico() {
  const r = await http.get("/home/contenido");
  return r.data;
}

// ADMIN
export async function listarAreasHome() {
  const r = await http.get("/home/areas");
  return r.data;
}

export async function listarContenidoHomeAdmin(params = {}) {
  const r = await http.get("/home/contenido/admin", { params });
  return r.data;
}

export async function subirContenidoHome({ area_id, titulo, descripcion, orden, archivo }) {
  const form = new FormData();
  form.append("area_id", area_id);
  if (titulo) form.append("titulo", titulo);
  if (descripcion) form.append("descripcion", descripcion);
  if (orden !== undefined && orden !== null) form.append("orden", orden);
  form.append("archivo", archivo);

  const r = await http.post("/home/contenido", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data;
}

export async function actualizarContenidoHome(id, payload) {
  const r = await http.put(`/home/contenido/${id}`, payload);
  return r.data;
}

export async function cambiarEstadoContenidoHome(id, activo) {
  const r = await http.patch(`/home/contenido/${id}/estado`, { activo });
  return r.data;
}

export async function eliminarContenidoHome(id) {
  const r = await http.delete(`/home/contenido/${id}`);
  return r.data;
}
