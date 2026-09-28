import { http } from "./http.js";

/** Responde si la API está viva (la usa el aviso de conexión). */
export async function verificarServidor() {
  const { data } = await http.get("/salud", { timeout: 60_000 });
  return data;
}
