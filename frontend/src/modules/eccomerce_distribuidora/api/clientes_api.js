import { http } from "../../../api/http.js";

export async function getClientes(params) {
  const { data } = await http.get("/distribuidora/clientes", { params });
  return data;
}
