import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import * as api from "../api/tienda_api.js";
import { tiendaKeys } from "./use_carrito.js";

export const usePerfil = () => useQuery({ queryKey: tiendaKeys.perfil(), queryFn: api.verPerfil });

export function useGuardarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.guardarPerfil, onSuccess: (perfil) => queryClient.setQueryData(tiendaKeys.perfil(), perfil) });
}

export function useEnviarPedido() {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  return useMutation({
    mutationFn: api.enviarPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiendaKeys.carrito(usuario?.id) });
      queryClient.invalidateQueries({ queryKey: ["tienda", "pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["catalogo"] }); // cambia la disponibilidad
    },
  });
}

export const useMisPedidos = (filtros) => useQuery({ queryKey: tiendaKeys.pedidos(filtros), queryFn: () => api.misPedidos(filtros), placeholderData: keepPreviousData });
export const usePedido = (id) => useQuery({ queryKey: tiendaKeys.pedido(id), queryFn: () => api.verPedido(id) });

// ── Panel ──
export const panelKeys = {
  todo: ["pedidos_panel"],
  lista: (filtros) => ["pedidos_panel", "lista", filtros],
  resumen: () => ["pedidos_panel", "resumen"],
  pedido: (id) => ["pedidos_panel", "pedido", String(id)],
};

export const usePedidosPanel = (filtros) => useQuery({ queryKey: panelKeys.lista(filtros), queryFn: () => api.listarPedidos(filtros), placeholderData: keepPreviousData });
export const useResumenPedidos = () => useQuery({ queryKey: panelKeys.resumen(), queryFn: api.resumenPedidos });
export const usePedidoPanel = (id) => useQuery({ queryKey: panelKeys.pedido(id), queryFn: () => api.verPedidoPanel(id) });

// Cada acción devuelve el pedido actualizado; además cambian listados, resumen y stock.
function useAccionPedido(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (pedido) => {
      queryClient.setQueryData(panelKeys.pedido(pedido.id), pedido);
      queryClient.invalidateQueries({ queryKey: panelKeys.todo });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
    },
  });
}

export const useCambiarEstado = () => useAccionPedido(api.cambiarEstado);
export const useRegistrarCobro = () => useAccionPedido(api.registrarCobro);
export const useAnularCobro = () => useAccionPedido(api.anularCobro);
