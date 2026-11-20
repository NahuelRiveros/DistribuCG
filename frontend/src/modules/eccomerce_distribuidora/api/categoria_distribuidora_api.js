import { http } from "../../../core/api/http.js";

// Solo toma `vista`: el panel la pasa directo como queryFn y TanStack le manda su contexto como argumento.
export async function getCategorias({ vista } = {}) {
  const { data } = await http.get("/distribuidora/catalogos/categorias", { params: vista ? { vista } : undefined });
  return data.data;
}

export async function crearCategoria(payload) {
  const { data } = await http.post("/distribuidora/catalogos/categorias", payload);
  return data;
}

export async function actualizarCategoria(id, payload) {
  const { data } = await http.put(`/distribuidora/catalogos/categorias/${id}`, payload);
  return data;
}

export async function eliminarCategoria(id) {
  const { data } = await http.delete(`/distribuidora/catalogos/categorias/${id}`);
  return data;
}

export async function fusionarCategoria(id, destinoId) {
  const { data } = await http.post(`/distribuidora/catalogos/categorias/${id}/fusionar`, { destino_id: destinoId });
  return data;
}

export async function moverCategorias(ids, familiaId) {
  const { data } = await http.patch("/distribuidora/catalogos/categorias/mover", { ids, familia_id: familiaId });
  return data;
}
