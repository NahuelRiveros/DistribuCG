import axios from "axios";
import { proyecto } from "compartido/proyecto.js";

// Traído de DistribuCG (api/http.js). Instancia única para todas las llamadas al API.
export const CLAVE_SESION = `${proyecto.cliente}:sesion`;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_SESION);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ante un 401 (sesión vencida) se limpia el token y se avisa a AuthProvider.
http.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/login")) {
      localStorage.removeItem(CLAVE_SESION);
      window.dispatchEvent(new Event("auth:vencida"));
    }
    return Promise.reject(error);
  },
);

/** Mensaje para mostrar al usuario a partir de un error del API. */
export function mensajeDeError(error, porDefecto = "No pudimos completar la acción. Intentá de nuevo.") {
  if (!error?.response) return "No hay conexión con el servidor. Revisá tu internet e intentá de nuevo.";
  return error.response.data?.mensaje ?? porDefecto;
}
