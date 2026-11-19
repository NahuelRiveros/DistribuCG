import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { preciosClienteApi } from "../api/precios_cliente_api.js";

const CLAVE = "precios-cliente";
export const mensajeDeError = (e, porDefecto) => e?.response?.data?.mensaje || porDefecto;

export const useHistorialPrecios = () => useQuery({ queryKey: [CLAVE, "historial"], queryFn: preciosClienteApi.historial });

export const useActualizacionPrecios = (id) => useQuery({
  queryKey: [CLAVE, id], queryFn: () => preciosClienteApi.detalle(id), enabled: Boolean(id),
});

export const useFilasPrecios = (id, filtros) => useQuery({
  queryKey: [CLAVE, id, "filas", filtros], queryFn: () => preciosClienteApi.filas(id, filtros),
  enabled: Boolean(id && filtros.estado), placeholderData: keepPreviousData,
});

export function useValidarLista() {
  const queryClient = useQueryClient();
  return useMutation({
    // La clave queda fija por archivo: un reintento devuelve la misma vista previa, no crea otra.
    mutationFn: ({ archivo, key }) => preciosClienteApi.validar(archivo, key),
    onSuccess: (trabajo) => {
      queryClient.setQueryData([CLAVE, trabajo.id], trabajo);
      queryClient.invalidateQueries({ queryKey: [CLAVE, "historial"] });
    },
  });
}

/** Mutaciones sobre una actualización: todas devuelven el trabajo actualizado. */
function useAccion(id, fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (trabajo) => {
      queryClient.setQueryData([CLAVE, id], trabajo);
      queryClient.invalidateQueries({ queryKey: [CLAVE, id, "filas"] });
      queryClient.invalidateQueries({ queryKey: [CLAVE, "historial"] });
    },
  });
}
/** La decisión se ve al instante; si el servidor la rechaza, vuelve a como estaba. */
export function useDecidir(id) {
  const queryClient = useQueryClient();
  const filas = [CLAVE, id, "filas"];
  return useMutation({
    mutationFn: (cuerpo) => preciosClienteApi.decidir(id, cuerpo),
    onMutate: async (cuerpo) => {
      await queryClient.cancelQueries({ queryKey: filas });
      const anteriores = queryClient.getQueriesData({ queryKey: filas });
      queryClient.setQueriesData({ queryKey: filas }, (datos) => datos && {
        ...datos,
        filas: datos.filas.map((f) => {
          if (cuerpo.decisiones && f.cod in cuerpo.decisiones) return { ...f, decision: cuerpo.decisiones[f.cod] };
          if (cuerpo.aprobarTodos && f.estado === "revisar") return { ...f, decision: "aprobar" };
          return f;
        }),
      });
      return { anteriores };
    },
    onError: (_error, _cuerpo, contexto) => contexto?.anteriores.forEach(([clave, datos]) => queryClient.setQueryData(clave, datos)),
    onSuccess: (trabajo) => queryClient.setQueryData([CLAVE, id], trabajo),
    onSettled: () => queryClient.invalidateQueries({ queryKey: filas }),
  });
}
export const useCancelarActualizacion = (id) => useAccion(id, () => preciosClienteApi.cancelar(id));
export const useDeshacerActualizacion = (id) => useAccion(id, () => preciosClienteApi.deshacer(id));
export const useInforme = (id) => useMutation({ mutationFn: () => preciosClienteApi.informe(id) });

/**
 * Aplica los lotes de a uno, desde el último guardado en el servidor. Si se corta, "Continuar"
 * retoma desde ahí: el servidor ignora un lote ya aplicado, así que reintentar no duplica nada.
 */
export function useAplicarLotes(id) {
  const queryClient = useQueryClient();
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState("");
  const montado = useRef(true);
  // En modo estricto React monta, desmonta y vuelve a montar: hay que volver a marcarlo al montar.
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);

  const aplicar = useCallback(async (trabajo, ajustarListas) => {
    setAplicando(true); setError("");
    let actual = trabajo;
    try {
      while (montado.current && actual.estado !== "completado" && actual.siguiente_lote < actual.total_lotes) {
        actual = await preciosClienteApi.lote(id, { index: actual.siguiente_lote, confirm: true, ajustarListas: actual.ajustarListas ?? ajustarListas });
        queryClient.setQueryData([CLAVE, id], actual);
      }
    } catch (e) {
      if (montado.current) setError(mensajeDeError(e, "Se cortó la conexión. Tocá Continuar: retoma desde el último lote guardado sin repetirlo."));
      queryClient.invalidateQueries({ queryKey: [CLAVE, id] });
    } finally {
      if (montado.current) setAplicando(false);
      queryClient.invalidateQueries({ queryKey: [CLAVE, "historial"] });
      // El catálogo y los precios cambiaron: la gestión y la tienda los vuelven a pedir.
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== CLAVE });
    }
  }, [id, queryClient]);

  return { aplicar, aplicando, error };
}
