// El precio guardado en cada variedad es el FINAL (el que paga el cliente,
// nunca cambia) — `iva_porcentaje` es solo para desglosar informativamente
// cuánto de ese final es neto. Redondeo a 2 decimales.
export function precioSinIva(precioFinal, ivaPorcentaje) {
  const factor = 1 + Number(ivaPorcentaje ?? 0) / 100;
  return Math.round((Number(precioFinal) / factor) * 100) / 100;
}

export function formatearPrecio(n) {
  return `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
