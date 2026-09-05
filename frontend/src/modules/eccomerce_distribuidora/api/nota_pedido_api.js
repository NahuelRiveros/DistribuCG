import { http } from "../../../api/http.js";

export async function enviarNotaPedido(notas = null) {
  const { data } = await http.post("/distribuidora/notas-pedido", { notas });
  return data;
}

export async function getMisNotasPedido() {
  const { data } = await http.get("/distribuidora/notas-pedido");
  return data.data;
}

// admin/vendedor
export async function getTodasLasNotasPedido() {
  const { data } = await http.get("/distribuidora/notas-pedido/todas");
  return data.data;
}

export async function cambiarEstadoNotaPedido(id, estado) {
  const { data } = await http.put(`/distribuidora/notas-pedido/${id}/estado`, { estado });
  return data;
}

export async function registrarPagoNotaPedido(id, { monto, nota } = {}) {
  const { data } = await http.post(`/distribuidora/notas-pedido/${id}/pagos`, { monto, nota });
  return data;
}

export async function anularPagoNotaPedido(id, pagoId) {
  const { data } = await http.post(`/distribuidora/notas-pedido/${id}/pagos/${pagoId}/anular`);
  return data;
}

// Descarga directa del .xlsx — no hay precedente de descarga de archivos en
// el frontend todavía, se arma acá con el patrón estándar de axios (blob +
// <a download> temporal).
export async function exportarNotaPedido(id) {
  const res = await http.get(`/distribuidora/notas-pedido/${id}/export`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedido-${id}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
