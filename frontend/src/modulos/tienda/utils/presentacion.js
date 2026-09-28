import { proyecto } from "compartido/proyecto.js";

// Textos y colores de estados de pedido y cobro (los estados salen de proyecto.config.js).
const TONOS = { warning: "aviso", info: "info", success: "exito", danger: "peligro" };

export function estadoPedido(estado) {
  const config = proyecto.pedidos.estados[estado];
  return { etiqueta: config?.etiqueta ?? estado, tono: TONOS[config?.tono] ?? "neutro" };
}

export const ESTADOS_COBRO = {
  pendiente: { etiqueta: "Sin cobros", tono: "neutro" },
  parcial: { etiqueta: "Cobro parcial", tono: "aviso" },
  cobrado: { etiqueta: "Cobrado", tono: "exito" },
};

export const etiquetaModalidad = (valor) => proyecto.tienda.modalidades_entrega.find((m) => m.valor === valor)?.etiqueta ?? valor;
export const etiquetaMetodo = (valor) => proyecto.pedidos.metodos_cobro.find((m) => m.valor === valor)?.etiqueta ?? valor;

/** "#000123" */
export const numeroPedido = (id) => `#${String(id).padStart(6, "0")}`;

export const fechaHora = (fecha) => new Date(fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

export const nombrePersona = (u) => (u ? [u.nombre, u.apellido].filter(Boolean).join(" ") : "Sistema");
