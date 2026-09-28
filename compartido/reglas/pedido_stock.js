import { proyecto } from "../proyecto.js";

/**
 * Situación del stock de un pedido según su estado ("ninguna" | "reservado" | "descontado"),
 * para cada valor de proyecto.config.js → stock.descontar_en.
 * Reservado = ya no está disponible para otros, pero sigue en el depósito.
 */
const FASES = {
  envio_pedido: { pendiente: "descontado", en_preparacion: "descontado", entregado: "descontado", cancelado: "ninguna" },
  confirmacion: { pendiente: "reservado", en_preparacion: "descontado", entregado: "descontado", cancelado: "ninguna" },
  entrega: { pendiente: "reservado", en_preparacion: "reservado", entregado: "descontado", cancelado: "ninguna" },
};

export function faseStock(estado, descontarEn = proyecto.stock.descontar_en) {
  const fase = FASES[descontarEn]?.[estado];
  if (!fase) throw new Error(`No hay regla de stock para el estado "${estado}" con descontar_en "${descontarEn}"`);
  return fase;
}

/**
 * Movimientos de stock para pasar UNA línea de pedido de una fase a otra.
 * Devuelve [{ tipo, cantidad, reservado }] listos para registrarMovimiento().
 */
export function movimientosEntreFases(desde, hasta, cantidad) {
  if (desde === hasta) return [];
  const pasos = {
    "ninguna>reservado": [{ tipo: "reserva", cantidad: 0, reservado: cantidad }],
    "ninguna>descontado": [{ tipo: "venta", cantidad: -cantidad, reservado: 0 }],
    "reservado>descontado": [{ tipo: "venta", cantidad: -cantidad, reservado: -cantidad }],
    "reservado>ninguna": [{ tipo: "liberacion", cantidad: 0, reservado: -cantidad }],
    "descontado>ninguna": [{ tipo: "devolucion", cantidad, reservado: 0 }],
    "descontado>reservado": [
      { tipo: "devolucion", cantidad, reservado: 0 },
      { tipo: "reserva", cantidad: 0, reservado: cantidad },
    ],
  };
  const lista = pasos[`${desde}>${hasta}`];
  if (!lista) throw new Error(`Cambio de fase de stock no contemplado: ${desde} → ${hasta}`);
  return lista;
}
