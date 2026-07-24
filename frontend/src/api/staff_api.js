import { http } from "./http";

// LISTAR
export async function obtenerStaff() {
  const r = await http.get("/staff");
  return r.data;
}

// CREAR
export async function crearStaff(payload) {
  const r = await http.post("/staff", payload);
  return r.data;
}

// ACTUALIZAR
export async function actualizarStaff(usuarioId, payload) {
  const r = await http.put(`/staff/${usuarioId}`, payload);
  return r.data;
}

// PASSWORD
export async function cambiarPasswordStaff(usuarioId, password) {
  const r = await http.patch(`/staff/${usuarioId}/password`, {
    password,
  });
  return r.data;
}

// ESTADO
export async function cambiarEstadoStaff(usuarioId, activo) {
  const r = await http.patch(`/staff/${usuarioId}/estado`, {
    activo,
  });
  return r.data;
}