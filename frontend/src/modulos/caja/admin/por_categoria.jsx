import { formatearDinero } from "@/utils/formatear_dinero.js";
import { cn } from "@/utils/cn.js";
import { TIPOS } from "../utils/presentacion.js";

/** En qué se fue (y de dónde vino) la plata del año: una lista por tipo, de mayor a menor. */
export default function PorCategoria({ porCategoria, totales }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        ["ingreso", totales.ingresos],
        ["egreso", totales.egresos],
      ].map(([tipo, total]) => {
        const filas = porCategoria.filter((c) => c.tipo === tipo);
        return (
          <section key={tipo} className="rounded-2xl border border-borde bg-superficie p-4" aria-labelledby={`categorias-${tipo}`}>
            <h3 id={`categorias-${tipo}`} className="flex items-center gap-2 font-semibold">
              <span className={cn("h-2.5 w-2.5 rounded-sm", TIPOS[tipo].serie)} aria-hidden="true" /> {TIPOS[tipo].plural} por categoría
            </h3>
            {filas.length === 0 ? (
              <p className="mt-3 text-sm text-texto-suave">Sin {TIPOS[tipo].plural.toLowerCase()} en el año.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {filas.map((c) => {
                  const porcentaje = total > 0 ? Math.round((c.total / total) * 100) : 0;
                  return (
                    <li key={`${c.origen}-${c.categoria_id ?? c.categoria}`}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span>{c.categoria}</span>
                        <span className="tabular-nums">
                          {formatearDinero(c.total)} <span className="text-texto-suave">· {porcentaje} %</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-fondo" aria-hidden="true">
                        <div className={cn("h-2 rounded-full", TIPOS[tipo].serie)} style={{ width: `${Math.max(porcentaje, 1)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
