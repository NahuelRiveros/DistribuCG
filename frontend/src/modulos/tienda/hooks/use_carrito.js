import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import * as api from "../api/tienda_api.js";
import { guardarCarritoInvitado, leerCarritoInvitado, sumarItem } from "../utils/carrito_invitado.js";

export const tiendaKeys = {
  todo: ["tienda"],
  carrito: (usuarioId) => ["tienda", "carrito", usuarioId ?? "invitado"],
  invitado: () => ["tienda", "carrito_invitado"],
  cotizacion: (items) => ["tienda", "cotizacion", items],
  perfil: () => ["tienda", "perfil"],
  pedidos: (filtros) => ["tienda", "pedidos", filtros],
  pedido: (id) => ["tienda", "pedido", String(id)],
};

/**
 * Un solo carrito para toda la tienda, con o sin cuenta:
 * - con cuenta: vive en el servidor;
 * - sin cuenta: se guarda en el navegador y el servidor solo calcula precios y stock.
 * Las pantallas usan siempre la misma forma: { items, totales, se_puede_enviar, ... }.
 */
export function useCarrito() {
  const { usuario, cargando: cargandoSesion } = useAuth();
  const queryClient = useQueryClient();
  const conCuenta = Boolean(usuario);
  // El carrito del visitante vive en la caché compartida: navbar, detalle y carrito ven el mismo.
  const invitado = useQuery({ queryKey: tiendaKeys.invitado(), queryFn: () => leerCarritoInvitado().items, staleTime: Infinity });
  const itemsInvitado = invitado.data ?? [];

  const deCuenta = useQuery({ queryKey: tiendaKeys.carrito(usuario?.id), queryFn: api.verCarrito, enabled: conCuenta });
  const deInvitado = useQuery({
    queryKey: tiendaKeys.cotizacion(itemsInvitado),
    queryFn: () => api.cotizar(itemsInvitado),
    enabled: !conCuenta && !cargandoSesion && itemsInvitado.length > 0,
  });

  const actualizarInvitado = useCallback(
    (items) => {
      guardarCarritoInvitado(items);
      queryClient.setQueryData(tiendaKeys.invitado(), items);
    },
    [queryClient],
  );

  // Las operaciones con cuenta devuelven el carrito actualizado: se guarda directo, sin volver a pedirlo.
  const conRespuesta = (fn) => ({ mutationFn: fn, onSuccess: (carrito) => queryClient.setQueryData(tiendaKeys.carrito(usuario?.id), carrito) });
  const agregarCuenta = useMutation(conRespuesta(api.agregarItem));
  const cambiarCuenta = useMutation(conRespuesta(api.cambiarCantidad));
  const quitarCuenta = useMutation(conRespuesta(api.quitarItem));

  const vacio = { items: [], totales: { subtotal_neto: 0, iva: 0, total: 0 }, cantidad_unidades: 0, se_puede_enviar: false };
  const carrito = conCuenta ? deCuenta.data : itemsInvitado.length ? deInvitado.data : vacio;

  return {
    carrito: carrito ?? vacio,
    cargando: cargandoSesion || (conCuenta ? deCuenta.isPending : itemsInvitado.length > 0 && deInvitado.isPending),
    error: conCuenta ? deCuenta.error : deInvitado.error,
    recargar: () => (conCuenta ? deCuenta.refetch() : deInvitado.refetch()),
    conCuenta,
    ocupado: agregarCuenta.isPending || cambiarCuenta.isPending || quitarCuenta.isPending,

    async agregar(variante_id, cantidad) {
      if (conCuenta) return agregarCuenta.mutateAsync({ variante_id, cantidad });
      actualizarInvitado(sumarItem(itemsInvitado, variante_id, cantidad));
    },
    async cambiarCantidad(linea, cantidad) {
      if (conCuenta) return cambiarCuenta.mutateAsync({ item_id: linea.item_id, cantidad });
      actualizarInvitado(itemsInvitado.map((i) => (i.variante_id === linea.variante_id ? { ...i, cantidad } : i)));
    },
    async quitar(linea) {
      if (conCuenta) return quitarCuenta.mutateAsync(linea.item_id);
      actualizarInvitado(itemsInvitado.filter((i) => i.variante_id !== linea.variante_id));
    },
  };
}
