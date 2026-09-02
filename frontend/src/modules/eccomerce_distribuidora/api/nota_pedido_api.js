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

export async function cambiarPagoNotaPedido(id, pagado) {
  const { data } = await http.put(`/distribuidora/notas-pedido/${id}/pago`, { pagado });
  return data;
}
