// Todo cálculo de dinero se hace en centavos enteros y se redondea una sola vez,
// para no arrastrar errores de coma flotante (0.1 + 0.2 !== 0.3).
// La base guarda DECIMAL(12,2), que Sequelize devuelve como texto ("1234.50").

export function aCentavos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) throw new Error(`Importe inválido: ${valor}`);
  return Math.round(numero * 100);
}

export function desdeCentavos(centavos) {
  return centavos / 100;
}

/** Precio neto + IVA. `ivaPorcentaje` admite decimales (10.5). */
export function precioConIva(netoCentavos, ivaPorcentaje) {
  return Math.round((netoCentavos * (100 + Number(ivaPorcentaje))) / 100);
}

export function subtotalLinea(precioCentavos, cantidad) {
  return precioCentavos * cantidad;
}

export function sumarCentavos(importes) {
  return importes.reduce((total, importe) => total + importe, 0);
}
