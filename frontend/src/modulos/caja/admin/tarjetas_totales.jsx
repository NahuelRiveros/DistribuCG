import { formatearDinero } from "@/utils/formatear_dinero.js";
import { cn } from "@/utils/cn.js";
import { saldoTexto, TIPOS } from "../utils/presentacion.js";

/** Ingresos, egresos y saldo de un período. En celular, un solo recuadro compacto (una fila por dato). */
export default function TarjetasTotales({ totales, etiquetaSaldo = "Saldo" }) {
  const tarjetas = [
    { titulo: TIPOS.ingreso.plural, valor: formatearDinero(totales.ingresos), serie: TIPOS.ingreso.serie },
    { titulo: TIPOS.egreso.plural, valor: formatearDinero(totales.egresos), serie: TIPOS.egreso.serie },
    { titulo: etiquetaSaldo, valor: saldoTexto(totales.saldo), negativo: totales.saldo < 0 },
  ];
  return (
    <dl className="divide-y divide-borde rounded-2xl border border-borde bg-superficie sm:grid sm:grid-cols-3 sm:gap-3 sm:divide-y-0 sm:border-0 sm:bg-transparent">
      {tarjetas.map((t) => (
        <div key={t.titulo} className="flex items-center justify-between gap-3 px-4 py-3 sm:block sm:rounded-2xl sm:border sm:border-borde sm:bg-superficie sm:p-4">
          <dt className="flex items-center gap-2 text-sm text-texto-suave">
            {t.serie && <span className={cn("h-2.5 w-2.5 rounded-full", t.serie)} aria-hidden="true" />}
            {t.titulo}
          </dt>
          <dd className={cn("text-lg font-bold tabular-nums sm:mt-1 sm:text-2xl", t.negativo && "text-peligro")} data-testid={`total-${t.titulo.toLowerCase()}`}>
            {t.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
