import { http } from "../../../api/http.js";

export async function kioskIngreso(dni) {
  const r = await http.post("/ingresos/registrar", { dni });
  return r.data;
}
