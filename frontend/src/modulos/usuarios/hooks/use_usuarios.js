import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/usuarios_api.js";

export const usuariosKeys = {
  todo: ["usuarios"],
  lista: (filtros) => ["usuarios", "lista", filtros],
};

export function useUsuarios(filtros) {
  return useQuery({ queryKey: usuariosKeys.lista(filtros), queryFn: () => api.listarUsuarios(filtros), placeholderData: keepPreviousData });
}

function useMutacionUsuario(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.todo }) });
}

export const useCrearUsuario = () => useMutacionUsuario(api.crearUsuario);
export const useEditarUsuario = () => useMutacionUsuario(api.editarUsuario);
export const useCambiarEstadoUsuario = () => useMutacionUsuario(api.cambiarEstadoUsuario);
export const useCambiarContrasenaUsuario = () => useMutacionUsuario(api.cambiarContrasenaUsuario);
