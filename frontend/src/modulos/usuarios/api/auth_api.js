import { http } from "@/api/http.js";

export async function iniciarSesion(datos) {
  const r = await http.post("/auth/login", datos);
  return r.data.data;
}

export async function registrarCuenta(datos) {
  const r = await http.post("/auth/registro", datos);
  return r.data.data;
}

export async function obtenerYo() {
  const r = await http.get("/auth/yo");
  return r.data.data;
}
