import { proyecto } from "../proyecto.js";

/**
 * Devuelve el motivo por el que un cambio de estado de pedido NO se permite,
 * o null si se permite. La usan el servidor (para rechazar) y el frontend
 * (para deshabilitar botones y pedir motivo).
 */
export function problemaTransicion({ desde, hacia, motivo, estadoCobro }, reglas = proyecto.pedidos) {
  if (desde === hacia) return null;
  if (!reglas.transiciones[desde]?.includes(hacia)) return "Ese cambio de estado no está permitido.";
  if (reglas.estados_requieren_cobro.includes(hacia) && estadoCobro === "pendiente") {
    return "Registrá un cobro antes de avanzar a este estado.";
  }
  if (reglas.motivo_requerido.includes(`${desde}:${hacia}`) && String(motivo ?? "").trim().length < 3) {
    return "Indicá el motivo del cambio.";
  }
  return null;
}
