import { proyecto } from "compartido/proyecto.js";
import { aCentavos, desdeCentavos, precioConIva } from "compartido/reglas/dinero.js";

const CON_IVA = proyecto.tienda.precios_con_iva;

/** Precio a mostrar al público (en pesos), con o sin IVA según proyecto.config.js. */
export function precioVisible(neto, ivaPorcentaje) {
  if (neto == null) return null;
  const centavos = aCentavos(neto);
  return desdeCentavos(CON_IVA ? precioConIva(centavos, ivaPorcentaje) : centavos);
}

export const leyendaIva = CON_IVA ? "IVA incluido" : "+ IVA";

/** La presentación más barata (para "Desde $..."), priorizando las que tienen stock. */
export function presentacionMasBarata(producto) {
  const activas = (producto?.variantes ?? []).filter((v) => v.activo !== false);
  const conStock = activas.filter((v) => v.disponibilidad !== "sin_stock");
  const candidatas = conStock.length > 0 ? conStock : activas;
  return candidatas.reduce((min, v) => (min == null || Number(v.precio) < Number(min.precio) ? v : min), null);
}
