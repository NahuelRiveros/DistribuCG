import { http } from "./http";

// LISTAR
export async function obtenerPlanes(params = {}) {
  const r = await http.get("/planes", { params });
  return r.data;
}

// OBTENER POR ID
export async function obtenerPlan(id) {
  const r = await http.get(`/planes/${id}`);
  return r.data;
}

// CREAR
export async function crearPlan(payload) {
  const r = await http.post("/planes", payload);
  return r.data;
}

// ACTUALIZAR (PUT)
export async function actualizarPlan(id, payload) {
  const r = await http.put(`/planes/${id}`, payload);
  return r.data;
}

// CAMBIAR ESTADO (PATCH)
export async function cambiarEstadoPlan(id, activo) {
  const r = await http.patch(`/planes/${id}/estado`, { activo });
  return r.data;
}