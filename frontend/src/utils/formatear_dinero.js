const formato = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Recibe pesos (número o texto "1234.50", como lo devuelve el API) y devuelve "$ 1.234,50". */
export function formatearDinero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? formato.format(numero) : "—";
}
