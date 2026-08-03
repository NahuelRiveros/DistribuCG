import { http } from "./http";

export async function buscarPersonaKinesiologia(dni) {
  const r = await http.get("/kinesiologia/personas/buscar", { params: { dni } });
  return r.data;
}

export async function agregarPacienteKinesiologia(payload) {
  const r = await http.post("/kinesiologia/pacientes", payload);
  return r.data;
}

export async function getPacientesKinesiologia(params = {}) {
  const r = await http.get("/kinesiologia/pacientes", { params });
  return r.data;
}

export async function getDetallePacienteKinesiologia(pacienteKinesiologiaId) {
  const r = await http.get(`/kinesiologia/pacientes/${pacienteKinesiologiaId}/ficha`);
  return r.data;
}

export async function registrarTestFuncional(fichaId, payload) {
  const r = await http.post(`/kinesiologia/fichas/${fichaId}/test-funcional`, payload);
  return r.data;
}

export async function registrarTestFuerza(fichaId, payload) {
  const r = await http.post(`/kinesiologia/fichas/${fichaId}/test-fuerza`, payload);
  return r.data;
}

export async function registrarSesionKinesiologia(fichaId, payload) {
  const r = await http.post(`/kinesiologia/fichas/${fichaId}/sesiones`, payload);
  return r.data;
}
