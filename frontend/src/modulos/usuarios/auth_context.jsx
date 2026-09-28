/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CLAVE_SESION } from "@/api/http.js";
import { iniciarSesion, obtenerYo, registrarCuenta } from "./api/auth_api.js";

// Adaptado de DistribuCG (auth/auth_context.jsx).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(localStorage.getItem(CLAVE_SESION)));

  useEffect(() => {
    let activo = true;
    const alVencer = () => setUsuario(null);
    window.addEventListener("auth:vencida", alVencer);

    if (localStorage.getItem(CLAVE_SESION)) {
      obtenerYo()
        .then((u) => activo && setUsuario(u))
        .catch(() => activo && setUsuario(null))
        .finally(() => activo && setCargando(false));
    }
    return () => {
      activo = false;
      window.removeEventListener("auth:vencida", alVencer);
    };
  }, []);

  // Login y registro terminan igual: sesión iniciada con el token recibido.
  const conSesion = useCallback((pedir) => async (datos) => {
    const { token, usuario: u } = await pedir(datos);
    localStorage.setItem(CLAVE_SESION, token);
    setUsuario(u);
    return u;
  }, []);
  const login = useMemo(() => conSesion(iniciarSesion), [conSesion]);
  const registrar = useMemo(() => conSesion(registrarCuenta), [conSesion]);

  // Al salir se borra todo lo cacheado: en una compu compartida, el siguiente no ve carrito ni pedidos ajenos.
  const logout = useCallback(() => {
    localStorage.removeItem(CLAVE_SESION);
    setUsuario(null);
    queryClient.clear();
  }, [queryClient]);

  const valor = useMemo(() => ({ usuario, cargando, login, registrar, logout }), [usuario, cargando, login, registrar, logout]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  return contexto;
}
