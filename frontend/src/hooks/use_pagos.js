import { useQuery } from "@tanstack/react-query";
import { obtenerPagos } from "@/api/configuracion_api.js";

export const pagosKeys = { publico: ["configuracion", "pagos"], editar: ["configuracion", "pagos", "editar"] };

/**
 * Medios de pago, cuotas, promociones y CBU vigentes (se editan en Configuración → Pagos).
 * Se piden una vez y se reutilizan unos minutos: la ficha y cada tarjeta del catálogo leen lo mismo.
 */
export function usePagos() {
  return useQuery({ queryKey: pagosKeys.publico, queryFn: obtenerPagos, staleTime: 5 * 60 * 1000 });
}
