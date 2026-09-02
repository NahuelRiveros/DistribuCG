import { http } from "../../../api/http.js";

export async function getMiPerfil() {
  const { data } = await http.get("/distribuidora/mi-perfil");
  return data.data; // null si todavía no lo completó
}

export async function guardarMiPerfil(payload) {
  const { data } = await http.put("/distribuidora/mi-perfil", payload);
  return data;
}
