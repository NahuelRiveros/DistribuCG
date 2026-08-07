import { http } from "./http";

export async function buscarPersonaKinesiologia(dni) {
  const r = await http.get("/kinesiologia/personas/buscar", { params: { dni } });
  return r.data;
}

export async function getPersonasRegistradas(params = {}) {
  const r = await http.get("/kinesiologia/personas", { params });
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

export async function cambiarEstadoPacienteKinesiologia(pacienteKinesiologiaId, estado) {
  const r = await http.patch(`/kinesiologia/pacientes/${pacienteKinesiologiaId}/estado`, { estado });
  return r.data;
}

export async function registrarSesionKinesiologia(fichaId, payload) {
  const r = await http.post(`/kinesiologia/fichas/${fichaId}/sesiones`, payload);
  return r.data;
}

export async function eliminarSesionKinesiologia(sesionId) {
  const r = await http.delete(`/kinesiologia/sesiones/${sesionId}`);
  return r.data;
}

export async function agregarRecordatorioKinesiologia(sesionId, payload) {
  const r = await http.post(`/kinesiologia/sesiones/${sesionId}/recordatorios`, payload);
  return r.data;
}

export async function eliminarRecordatorioKinesiologia(recordatorioId) {
  const r = await http.delete(`/kinesiologia/recordatorios/${recordatorioId}`);
  return r.data;
}

export async function getPatologias() {
  const r = await http.get("/kinesiologia/patologias");
  return r.data;
}

export async function crearPatologia(payload) {
  const r = await http.post("/kinesiologia/patologias", payload);
  return r.data;
}

export async function actualizarPatologia(id, payload) {
  const r = await http.put(`/kinesiologia/patologias/${id}`, payload);
  return r.data;
}

export async function cambiarEstadoPatologia(id, activo) {
  const r = await http.patch(`/kinesiologia/patologias/${id}/estado`, { activo });
  return r.data;
}
