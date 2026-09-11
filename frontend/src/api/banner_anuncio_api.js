import { http } from "./http.js";

// Cinta de anuncios del sitio (ej. "Envío gratis desde $50.000") — hasta 4,
// visible en toda la app. Público y sin auth para la lectura (lo pinta
// app_layout.jsx en cada carga), gestión restringida a super_admin.
export async function getBannerPublico() {
  const { data } = await http.get("/banner", { publicAccess: true });
  return data.data;
}

export async function getBannerAdmin() {
  const { data } = await http.get("/banner/admin");
  return data;
}

export async function crearBannerAnuncio(payload) {
  const { data } = await http.post("/banner", payload);
  return data;
}

export async function actualizarBannerAnuncio(id, payload) {
  const { data } = await http.put(`/banner/${id}`, payload);
  return data;
}

export async function cambiarEstadoBannerAnuncio(id, activo) {
  const { data } = await http.patch(`/banner/${id}/estado`, { activo });
  return data;
}

export async function eliminarBannerAnuncio(id) {
  const { data } = await http.delete(`/banner/${id}`);
  return data;
}
