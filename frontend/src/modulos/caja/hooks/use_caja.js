import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/caja_api.js";

export const cajaKeys = {
  todo: ["caja"],
  anual: (anio) => ["caja", "anual", anio ?? "actual"],
  mes: (anio, mes) => ["caja", "mes", anio, mes],
  movimientos: (filtros) => ["caja", "movimientos", filtros],
  categorias: () => ["caja", "categorias"],
};

export const useBalanceAnual = (anio) => useQuery({ queryKey: cajaKeys.anual(anio), queryFn: () => api.balanceAnual(anio), placeholderData: keepPreviousData });
export const useBalanceMes = (anio, mes) => useQuery({ queryKey: cajaKeys.mes(anio, mes), queryFn: () => api.balanceMes({ anio, mes }), placeholderData: keepPreviousData });
export const useMovimientosCaja = (filtros, { enabled = true } = {}) =>
  useQuery({ queryKey: cajaKeys.movimientos(filtros), queryFn: () => api.listarMovimientos(filtros), enabled });
export const useCategoriasCaja = () => useQuery({ queryKey: cajaKeys.categorias(), queryFn: api.listarCategorias });

// Cualquier cambio de la caja mueve balance, calendario, listados y el conteo de las categorías.
function useMutacionCaja(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: cajaKeys.todo }) });
}

export const useCrearMovimiento = () => useMutacionCaja(api.crearMovimiento);
export const useEditarMovimiento = () => useMutacionCaja(api.editarMovimiento);
export const useAnularMovimiento = () => useMutacionCaja(api.anularMovimiento);
export const useCrearCategoria = () => useMutacionCaja(api.crearCategoria);
export const useEditarCategoria = () => useMutacionCaja(api.editarCategoria);
