import { http } from "./http.js";

export async function getCatalogos() {
  const r = await http.get("/catalogos");
  return r.data;
}