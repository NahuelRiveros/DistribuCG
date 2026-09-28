import { proyecto } from "compartido/proyecto.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";

export const TIPOS = {
  ingreso: { etiqueta: "Ingreso", plural: "Ingresos", signo: "+", serie: "bg-serie-1" },
  egreso: { etiqueta: "Egreso", plural: "Egresos", signo: "−", serie: "bg-serie-2" },
};

export const MEDIOS = proyecto.caja.medios;
export const etiquetaMedio = (valor) => MEDIOS.find((m) => m.valor === valor)?.etiqueta ?? valor;

/** "+ $ 1.500,00" / "− $ 800,00" */
export const montoConSigno = (tipo, monto) => `${TIPOS[tipo].signo} ${formatearDinero(monto)}`;

/** Saldo con signo explícito: el color nunca es la única pista de que es negativo. */
export const saldoTexto = (saldo) => (saldo < 0 ? `− ${formatearDinero(Math.abs(saldo))}` : formatearDinero(saldo));

/** Montos cortos para ejes y celdas chicas: 1.250.000 → "1,3 M"; 15.000 → "15 mil". */
export function montoCorto(valor) {
  const n = Math.abs(valor);
  if (n >= 1_000_000) return `${(valor / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${Math.round(valor / 1_000).toLocaleString("es-AR")} mil`;
  return valor.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}
