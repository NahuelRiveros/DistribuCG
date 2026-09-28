import { aCentavos, desdeCentavos, precioConIva } from "./dinero.js";

/**
 * Totales de una línea y de un pedido, en centavos y redondeando una sola vez por unidad.
 * Lo usan el carrito, el envío del pedido (servidor) y las pantallas: siempre dan lo mismo.
 * El precio final por unidad (con IVA) es el que ve el cliente en la tienda.
 */
export function totalesLinea({ precio, iva_porcentaje, cantidad }) {
  const neto = aCentavos(precio);
  const final = precioConIva(neto, iva_porcentaje);
  const subtotalFinal = final * cantidad;
  const subtotalNeto = neto * cantidad;
  return {
    precio_final_unitario: desdeCentavos(final),
    subtotal_neto: desdeCentavos(subtotalNeto),
    iva: desdeCentavos(subtotalFinal - subtotalNeto),
    subtotal_final: desdeCentavos(subtotalFinal),
  };
}

export function totalesPedido(lineas) {
  const suma = (campo) => desdeCentavos(lineas.reduce((total, l) => total + aCentavos(totalesLinea(l)[campo]), 0));
  return { subtotal_neto: suma("subtotal_neto"), iva: suma("iva"), total: suma("subtotal_final") };
}
