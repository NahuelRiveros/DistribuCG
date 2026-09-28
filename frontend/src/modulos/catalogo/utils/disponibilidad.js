import { proyecto } from "compartido/proyecto.js";

// Cómo se muestra la disponibilidad que informa el API por presentación.
const ESTADOS = {
  disponible: { etiqueta: "Disponible", tono: "exito" },
  ultimas: { etiqueta: "Últimas unidades", tono: "aviso" },
  sin_stock: { etiqueta: "Sin stock", tono: "peligro" },
};

/**
 * { etiqueta, tono }. "Quedan N" solo si la tienda está configurada para mostrar cantidades:
 * un admin navegando la tienda recibe la cantidad del API, pero tiene que ver lo mismo que un cliente.
 */
export function textoDisponibilidad(variante) {
  const estado = ESTADOS[variante?.disponibilidad] ?? ESTADOS.disponible;
  if (proyecto.stock.mostrar_cantidad_en_tienda && variante?.cantidad_disponible != null && variante.disponibilidad !== "sin_stock") {
    return { ...estado, etiqueta: `Quedan ${variante.cantidad_disponible}` };
  }
  return estado;
}

export const sinStock = (variante) => variante?.disponibilidad === "sin_stock";

/** Un producto está agotado si ninguna de sus presentaciones tiene stock. */
export const productoAgotado = (producto) => producto.variantes.length > 0 && producto.variantes.every(sinStock);
