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

// PÚBLICO — textos + pilares + contactos + layout de áreas, para la landing page
export async function obtenerConfigHomePublico() {
  const r = await http.get("/home/config");
  return r.data;
}

// ADMIN — textos
export async function listarTextosHome() {
  const r = await http.get("/home/textos");
  return r.data;
}

export async function actualizarTextosHome(cambios) {
  const r = await http.put("/home/textos", cambios);
  return r.data;
}

// ADMIN — pilares
export async function listarPilaresHome() {
  const r = await http.get("/home/pilares");
  return r.data;
}

export async function crearPilarHome(payload) {
  const r = await http.post("/home/pilares", payload);
  return r.data;
}

export async function actualizarPilarHome(id, payload) {
  const r = await http.put(`/home/pilares/${id}`, payload);
  return r.data;
}

export async function cambiarEstadoPilarHome(id, activo) {
  const r = await http.patch(`/home/pilares/${id}/estado`, { activo });
  return r.data;
}

export async function eliminarPilarHome(id) {
  const r = await http.delete(`/home/pilares/${id}`);
  return r.data;
}

// ADMIN — contactos
export async function listarContactosHome() {
  const r = await http.get("/home/contactos");
  return r.data;
}

export async function crearContactoHome(payload) {
  const r = await http.post("/home/contactos", payload);
  return r.data;
}

export async function actualizarContactoHome(id, payload) {
  const r = await http.put(`/home/contactos/${id}`, payload);
  return r.data;
}

export async function cambiarEstadoContactoHome(id, activo) {
  const r = await http.patch(`/home/contactos/${id}/estado`, { activo });
  return r.data;
}

export async function eliminarContactoHome(id) {
  const r = await http.delete(`/home/contactos/${id}`);
  return r.data;
}

// ADMIN — layout de área (grid | carrusel)
export async function actualizarLayoutAreaHome(id, layout) {
  const r = await http.patch(`/home/areas/${id}/layout`, { layout });
  return r.data;
}
