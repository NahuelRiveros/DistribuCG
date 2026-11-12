// PED-75 y PED-76: textos según el estado del pedido. Funciones puras (las prueba
// servidor/tests/ux_rules.test.mjs). Los nombres de estado son los de order_config.js.

/** Pasos que ve el cliente, en orden. Cancelado se muestra aparte. */
export const PASOS_CLIENTE = ["pendiente", "confirmado", "en_curso", "entregado"];

/** Qué pasa ahora, en una línea, para quien mira su pedido. */
export function queSigue(estado) {
  return {
    pendiente: "Lo estamos revisando: te avisamos cuando lo confirmemos.",
    confirmado: "Está confirmado. Lo vamos a preparar para la entrega.",
    en_curso: "Lo estamos preparando para entregártelo.",
    entregado: "Entregado. ¡Gracias por tu compra!",
    cancelada: "Este pedido se canceló.",
  }[estado] ?? "";
}

const FRASE = {
  pendiente: "lo recibimos y lo estamos revisando",
  confirmado: "está confirmado",
  en_curso: "lo estamos preparando",
  entregado: "figura como entregado. ¡Gracias por tu compra!",
  cancelada: "se canceló",
};

/** Mensaje que el equipo le manda al cliente desde el panel, con el link a su pedido. */
export function mensajeEstadoCliente({ id, estado, nombre }, negocio, url) {
  const primerNombre = String(nombre ?? "").trim().split(/\s+/)[0];
  return [
    `¡Hola${primerNombre ? ` ${primerNombre}` : ""}! Te escribimos de ${negocio} por tu pedido #${id}: ${FRASE[estado] ?? "te contamos cómo va"}.`,
    ...(url ? [`Podés verlo acá: ${url}`] : []),
  ].join("\n");
}

/**
 * Número para wa.me: solo dígitos, con 549 adelante si no trae el código de país (Argentina).
 * null si no hay un número usable.
 */
export function numeroWhatsapp(celular) {
  const digitos = String(celular ?? "").replace(/\D/g, "");
  if (digitos.length < 8) return null;
  return digitos.startsWith("54") ? digitos : `549${digitos}`;
}

export const linkWhatsapp = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
