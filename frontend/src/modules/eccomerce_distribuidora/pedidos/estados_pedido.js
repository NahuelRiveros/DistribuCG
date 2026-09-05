// Config compartida entre el admin de pedidos (nota_pedido_card.jsx) y la
// vista del cliente (carrito/mis_pedidos_page.jsx) — antes cada uno tenía su
// propia copia de ESTADOS, ahora hay una sola fuente de verdad.

export const ESTADOS = {
  pendiente: { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  en_curso:  { label: "En curso",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  entregado: { label: "Entregado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelada: { label: "Cancelada", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const ESTADOS_PAGO = {
  pendiente: { label: "Sin pagos",     className: "bg-rose-50 text-rose-700 border-rose-200" },
  parcial:   { label: "Pago parcial",  className: "bg-amber-50 text-amber-700 border-amber-200" },
  pagado:    { label: "Pagado",        className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// Mismo criterio que ESTADOS_QUE_REQUIEREN_PAGO en el backend
// (servidor/src/services/distribuidora/nota_pedido_service.js) — se
// duplica acá a propósito porque es una regla de UI (deshabilitar botones,
// mostrar el aviso antes de que el usuario intente y el server la rechace),
// el backend sigue siendo quien la hace cumplir de verdad.
export const ESTADOS_QUE_REQUIEREN_PAGO = ["en_curso", "entregado"];

export function requierePagoParaEstado(estado) {
  return ESTADOS_QUE_REQUIEREN_PAGO.includes(estado);
}
