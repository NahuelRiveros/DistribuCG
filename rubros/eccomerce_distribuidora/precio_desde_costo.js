// Precio de venta desde el costo (PRE-60 a PRE-69). Regla única: la usan la ficha, el servidor, el ajuste masivo,
// la importación y la lista del cliente. Precio guardado = FINAL (con IVA), como siempre (PRE-01).
export const COSTO_MAXIMO = 99_999_999;
export const RENTABILIDAD_MAXIMA = 1000;
// Rango de la columna `rentabilidad` (numeric(6,2)): una recalculada (PRE-63) puede salir negativa o muy alta.
const RENTABILIDAD_GUARDABLE = { min: -9999.99, max: 9999.99 };

const centavos = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const numero = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

/** PRE-61: costo × (1 + rentabilidad %) × (1 + IVA %), redondeado a pesos enteros. Ej.: 1000, 30, 21 → 1573. */
export function precioDesdeCosto({ costo, rentabilidad, iva }) {
  return Math.round(Number(costo) * (1 + Number(rentabilidad) / 100) * (1 + Number(iva ?? 0) / 100));
}

/** Detalle para mostrar: neto con ganancia, IVA y ganancia por unidad (sobre el precio ya redondeado). */
export function desglosePrecio({ costo, rentabilidad, iva }) {
  const precio = precioDesdeCosto({ costo, rentabilidad, iva });
  const neto = centavos(precio / (1 + Number(iva ?? 0) / 100));
  return { precio, neto, iva: centavos(precio - neto), ganancia: centavos(neto - Number(costo)) };
}

/**
 * PRE-63: rentabilidad que deja un precio final con ese costo: precio ÷ (1 + IVA) ÷ costo − 1, en % con 2 decimales.
 * null si no hay costo (no se puede calcular). Acotada al rango que se puede guardar.
 */
export function rentabilidadResultante({ costo, precio, iva }) {
  const c = numero(costo), p = numero(precio);
  if (!c || c <= 0 || p === null || !Number.isFinite(p)) return null;
  const r = centavos((p / (1 + Number(iva ?? 0) / 100) / c - 1) * 100);
  return Math.min(RENTABILIDAD_GUARDABLE.max, Math.max(RENTABILIDAD_GUARDABLE.min, r));
}

/** PRE-67: el precio final no cubre el costo con IVA (se vende perdiendo plata). */
export function debajoDelCosto({ costo, precio, iva }) {
  const c = numero(costo), p = numero(precio);
  if (!c || c <= 0 || p === null || p <= 0) return false;
  return p < centavos(c * (1 + Number(iva ?? 0) / 100));
}

/**
 * PRE-69: valida costo y rentabilidad cargados a mano. Devuelve { costo, rentabilidad } o { error } con el mensaje
 * para quien carga. `obligatorios`: en "Desde el costo" van los dos.
 */
export function validarCostoYRentabilidad({ costo, rentabilidad }, { obligatorios = false } = {}) {
  const c = numero(costo), r = numero(rentabilidad);
  if (obligatorios && (c === null || r === null)) return { error: "Para calcular el precio cargá el costo neto y la rentabilidad." };
  if (c !== null && (!Number.isFinite(c) || c <= 0 || c > COSTO_MAXIMO)) return { error: "El costo neto tiene que ser mayor a 0 y hasta $99.999.999." };
  if (r !== null && (!Number.isFinite(r) || r < 0 || r > RENTABILIDAD_MAXIMA || centavos(r) !== r)) {
    return { error: "La rentabilidad tiene que estar entre 0 % y 1.000 %, con hasta 2 decimales." };
  }
  return { costo: c === null ? null : centavos(c), rentabilidad: r };
}
