// Flujo comercial compartido entre la API y la interfaz. No procesa pagos.
export const orderConfig = {
  managementRoles: ["admin", "staff", "vendedor"],
  states: {
    pendiente: { label: "Recibido", tone: "warning" },
    en_curso: { label: "En preparación", tone: "info" },
    entregado: { label: "Entregado", tone: "success" },
    cancelada: { label: "Cancelado", tone: "danger" },
  },
  transitions: {
    pendiente: ["en_curso", "cancelada"],
    en_curso: ["pendiente", "entregado", "cancelada"],
    entregado: ["en_curso"],
    cancelada: ["pendiente"],
  },
  // Preparación/entrega y cobro son ejes independientes; permite venta a cuenta.
  // Para exigir un cobro previo en otro cliente: ["entregado"], por ejemplo.
  paymentRequiredStates: [],
  reasonRequired: ["en_curso:pendiente", "entregado:en_curso", "cancelada:pendiente", "pendiente:cancelada", "en_curso:cancelada"],
  paymentMethods: [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
    { value: "otro", label: "Otro medio" },
  ],
};
export function transitionProblem(from, to, reason, paymentState) {
  if (from === to) return null;
  if (!orderConfig.transitions[from]?.includes(to)) return "Ese cambio de estado no está permitido.";
  if (orderConfig.paymentRequiredStates.includes(to) && paymentState === "pendiente") return "Registrá un cobro antes de avanzar a este estado.";
  if (orderConfig.reasonRequired.includes(from + ":" + to) && String(reason ?? "").trim().length < 3) return "Indicá el motivo del cambio.";
  return null;
}
