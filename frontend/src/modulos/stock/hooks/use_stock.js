import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogoKeys } from "@/modulos/catalogo/hooks/use_catalogo.js";
import * as api from "../api/stock_api.js";

export const stockKeys = {
  todo: ["stock"],
  existencias: (filtros) => ["stock", "existencias", filtros],
  resumen: () => ["stock", "resumen"],
  historial: (id, filtros) => ["stock", "historial", String(id), filtros],
};

export function useExistencias(filtros, { enabled = true } = {}) {
  return useQuery({ queryKey: stockKeys.existencias(filtros), queryFn: () => api.listarExistencias(filtros), placeholderData: keepPreviousData, enabled });
}

export const useResumenStock = () => useQuery({ queryKey: stockKeys.resumen(), queryFn: api.resumenStock });

export function useHistorialStock(variante_id, filtros) {
  return useQuery({ queryKey: stockKeys.historial(variante_id, filtros), queryFn: () => api.historial(variante_id, filtros), placeholderData: keepPreviousData });
}

// Un cambio de stock afecta existencias, resumen, historial y la disponibilidad que muestra el catálogo.
function useMutacionStock(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.todo });
      queryClient.invalidateQueries({ queryKey: catalogoKeys.todo });
    },
  });
}

export const useConfigurarStock = () => useMutacionStock(api.configurarStock);
export const useRegistrarIngreso = () => useMutacionStock(api.registrarIngreso);
export const useRegistrarAjuste = () => useMutacionStock(api.registrarAjuste);
