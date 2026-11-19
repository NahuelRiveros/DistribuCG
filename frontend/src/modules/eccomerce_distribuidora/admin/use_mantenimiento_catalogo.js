import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mantenimientoCatalogoApi } from "../api/mantenimiento_catalogo_api.js";

const CLAVE = ["mantenimiento-catalogo"];
export const mensajeDeError = (e, porDefecto) => e?.response?.data?.mensaje || porDefecto;

export const useEstadoCatalogo = () => useQuery({ queryKey: CLAVE, queryFn: mantenimientoCatalogoApi.estado });
export const useCopiaCatalogo = () => useMutation({ mutationFn: mantenimientoCatalogoApi.copia });

/** Después de limpiar o cargar, todo lo que muestra el catálogo cambió. */
const refrescarTodo = (queryClient) => queryClient.invalidateQueries();

export function useLimpiarCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: mantenimientoCatalogoApi.limpiar, onSuccess: () => refrescarTodo(queryClient) });
}

/**
 * Carga el catálogo por lotes desde el último guardado en el servidor. Si se corta, "Continuar" retoma ahí:
 * un lote ya cargado no se repite.
 */
export function useCargarCatalogo() {
  const queryClient = useQueryClient();
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState("");
  const montado = useRef(true);
  // En modo estricto React monta, desmonta y vuelve a montar: hay que volver a marcarlo al montar.
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);

  const cargar = useCallback(async (desde = 0) => {
    setCargando(true); setError("");
    let lote = desde, actual = null;
    try {
      do {
        actual = await mantenimientoCatalogoApi.cargarLote(lote);
        if (montado.current) setProgreso(actual);
        lote = actual.siguiente_lote;
      } while (montado.current && actual.estado !== "completado");
    } catch (e) {
      if (montado.current) setError(mensajeDeError(e, "Se cortó la carga. Tocá Continuar: retoma desde el último lote guardado."));
    } finally {
      if (montado.current) setCargando(false);
      refrescarTodo(queryClient);
    }
  }, [queryClient]);

  return { cargar, cargando, progreso, error };
}
