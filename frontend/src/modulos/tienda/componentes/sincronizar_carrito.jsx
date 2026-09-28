import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import { fusionarCarrito } from "../api/tienda_api.js";
import { tiendaKeys } from "../hooks/use_carrito.js";
import { borrarCarritoInvitado, leerCarritoInvitado } from "../utils/carrito_invitado.js";

/**
 * Al iniciar sesión (o registrarse), suma al carrito de la cuenta lo que el visitante
 * había armado en este navegador. El servidor recorta lo que no alcance y lo avisa.
 * No dibuja nada: se monta una vez en el layout de la tienda.
 */
export default function SincronizarCarrito() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const enCurso = useRef(false);

  useEffect(() => {
    const { clave, items } = leerCarritoInvitado();
    if (!usuario || items.length === 0 || enCurso.current) return;
    enCurso.current = true;
    fusionarCarrito({ clave, items })
      .then(({ avisos, ...carrito }) => {
        borrarCarritoInvitado();
        queryClient.setQueryData(tiendaKeys.invitado(), []);
        queryClient.setQueryData(tiendaKeys.carrito(usuario.id), carrito);
        for (const aviso of avisos ?? []) toast.info(aviso);
      })
      .catch((error) => toast.error(mensajeDeError(error, "No pudimos sumar tu carrito a tu cuenta.")))
      .finally(() => {
        enCurso.current = false;
      });
  }, [usuario, queryClient, toast]);

  return null;
}
