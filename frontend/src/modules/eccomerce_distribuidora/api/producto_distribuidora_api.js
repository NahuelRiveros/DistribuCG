import { http } from "../../../api/http.js";

export async function getProductos(params = {}) {
  const { data } = await http.get("/distribuidora/productos", { params });
  return data; // { ok, data, total, pagina, total_paginas }
}

export async function getProducto(id) {
  const { data } = await http.get(`/distribuidora/productos/${id}`);
  return data.data;
}

export async function crearProducto(payload) {
  const { data } = await http.post("/distribuidora/productos", payload);
  return data;
}

export async function actualizarProducto(id, payload) {
  const { data } = await http.put(`/distribuidora/productos/${id}`, payload);
  return data;
}

export async function cambiarEstadoProducto(id, activo) {
  const { data } = await http.put(`/distribuidora/productos/${id}/estado`, { activo });
  return data;
}

export async function eliminarProducto(id) {
  const { data } = await http.delete(`/distribuidora/productos/${id}`);
  return data;
}

export async function ajustarPreciosMasivo(payload) {
  const { data } = await http.post("/distribuidora/productos/ajustar-precios", payload);
  return data;
}

export async function crearVariedad(productoId, payload) {
  const { data } = await http.post(`/distribuidora/productos/${productoId}/variedades`, payload);
  return data;
}

export async function actualizarVariedad(id, payload) {
  const { data } = await http.put(`/distribuidora/productos/variedades/${id}`, payload);
  return data;
}

export async function eliminarVariedad(id) {
  const { data } = await http.delete(`/distribuidora/productos/variedades/${id}`);
  return data;
}
