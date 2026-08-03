import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { authConfig } from "../config/auth_config.js";
import { getEstadoModulos } from "../api/modulos_api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modulosHabilitados, setModulosHabilitados] = useState(null);

  const token = localStorage.getItem(authConfig.storageKey);

  async function cargarMe() {
    try {
      const r = await http.get(authConfig.endpoints.me);
      setUsuario(r.data?.usuario ?? null);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }

  async function cargarModulos() {
    try {
      const r = await getEstadoModulos();
      setModulosHabilitados(r?.modulos ?? null);
    } catch {
      setModulosHabilitados(null);
    }
  }

  useEffect(() => {
    // si hay token, intentamos /me y el estado de módulos al iniciar
    if (token) {
      cargarMe();
      cargarModulos();
    } else {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(payload) {
    const r = await http.post(authConfig.endpoints.login, payload);
    const nuevoToken = r.data?.token;

    if (nuevoToken) localStorage.setItem(authConfig.storageKey, nuevoToken);
    // luego traemos el usuario real desde /me para no depender del response del login
    await cargarMe();
    await cargarModulos();

    return r.data;
  }

  async function logout() {
    try {
      await http.post(authConfig.endpoints.logout);
    } catch {
      // si falla igual limpiamos local
    } finally {
      localStorage.removeItem(authConfig.storageKey);
      setUsuario(null);
    }
  }

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      isAuth: !!usuario,
      modulosHabilitados,
      login,
      logout,
      recargarUsuario: cargarMe,
    }),
    [usuario, cargando, modulosHabilitados]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
