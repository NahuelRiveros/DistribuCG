// Validación de datos bancarios argentinos. Un CBU mal tipeado es plata que se transfiere
// a otra cuenta (o rebota): por eso se validan los dígitos verificadores, no solo el largo.

const soloDigitos = (texto) => String(texto ?? "").replace(/[\s-]/g, "");
const verificador = (digitos, pesos) => (10 - (pesos.reduce((suma, peso, i) => suma + Number(digitos[i]) * peso, 0) % 10)) % 10;

/** CBU: 22 dígitos en 2 bloques (banco+sucursal / cuenta), cada uno con su dígito verificador. */
export function cbuValido(cbu) {
  const c = soloDigitos(cbu);
  if (!/^\d{22}$/.test(c)) return false;
  return verificador(c.slice(0, 7), [7, 1, 3, 9, 7, 1, 3]) === Number(c[7]) && verificador(c.slice(8, 21), [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]) === Number(c[21]);
}

/** Alias CBU: de 6 a 20 caracteres, letras, números, puntos y guiones. */
export const aliasValido = (alias) => /^[a-zA-Z0-9.-]{6,20}$/.test(String(alias ?? "").trim());

/** CUIT/CUIL: 11 dígitos con dígito verificador (módulo 11). Acepta guiones. */
export function cuitValido(cuit) {
  const c = soloDigitos(cuit);
  if (!/^\d{11}$/.test(c)) return false;
  const suma = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2].reduce((total, peso, i) => total + Number(c[i]) * peso, 0);
  const digito = 11 - (suma % 11);
  if (digito === 10) return false;
  return (digito === 11 ? 0 : digito) === Number(c[10]);
}

export { soloDigitos };
