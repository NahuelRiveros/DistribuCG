import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { guardarPagos, pagosParaEditar } from "@/api/configuracion_api.js";
import { pagosKeys } from "@/hooks/use_pagos.js";

export const usePagosParaEditar = () => useQuery({ queryKey: pagosKeys.editar, queryFn: pagosParaEditar });

/** Al guardar, la tienda (ficha, catálogo, checkout) pasa a ver la config nueva. */
export function useGuardarPagos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guardarPagos,
    onSuccess: (data) => {
      queryClient.setQueryData(pagosKeys.editar, data);
      queryClient.setQueryData(pagosKeys.publico, data.valor);
    },
  });
}
