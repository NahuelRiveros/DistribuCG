import { http } from "../../../api/http.js";

export async function registrarPago(payload) {
  const r = await http.post("/pagos/registrar", payload);
  return r.data;
}

export async function previewPago(documento) {
  const r = await http.get("/pagos/preview", { params: { documento } });
  return r.data;
}