import { columnaPrimerDia, DIAS_SEMANA, fechaLarga } from "compartido/reglas/fechas.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { cn } from "@/utils/cn.js";
import { montoCorto } from "../utils/presentacion.js";

function Montos({ dia, corto = false }) {
  const formato = corto ? montoCorto : formatearDinero;
  return (
    <span className="flex flex-col gap-0.5 text-xs tabular-nums">
      {dia.ingresos > 0 && (
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-serie-1" aria-hidden="true" />+ {formato(dia.ingresos)}
        </span>
      )}
      {dia.egresos > 0 && (
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-serie-2" aria-hidden="true" />− {formato(dia.egresos)}
        </span>
      )}
    </span>
  );
}

const descripcion = (d) =>
  `${fechaLarga(d.fecha)}: ${d.cantidad === 0 ? "sin movimientos" : `ingresos ${formatearDinero(d.ingresos)}, egresos ${formatearDinero(d.egresos)}`}`;

/**
 * Escritorio: grilla del mes (lunes a domingo). Celular: lista de los días con movimientos,
 * porque 7 columnas con montos no entran en una pantalla angosta.
 */
export default function CalendarioMes({ anio, mes, dias, hoy, elegido, onElegir }) {
  const vacias = columnaPrimerDia(anio, mes);
  const conMovimientos = dias.filter((d) => d.cantidad > 0);

  return (
    <>
      <div className="hidden rounded-2xl border border-borde bg-superficie p-2 md:block">
        <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-texto-suave" aria-hidden="true">
          {DIAS_SEMANA.map((d) => (
            <span key={d} className="py-2">
              {d}
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1" aria-label="Días del mes">
          {Array.from({ length: vacias }, (_, i) => (
            <li key={`vacia-${i}`} aria-hidden="true" />
          ))}
          {dias.map((d) => {
            const futuro = d.fecha > hoy;
            return (
              <li key={d.fecha}>
                <button
                  type="button"
                  onClick={() => onElegir(d.fecha)}
                  aria-pressed={elegido === d.fecha}
                  aria-label={descripcion(d)}
                  className={cn(
                    "flex h-24 w-full flex-col items-start gap-1 rounded-xl border p-2 text-left transition hover:border-primario",
                    elegido === d.fecha ? "border-primario ring-2 ring-primario/20" : "border-borde",
                    futuro && "opacity-50",
                  )}
                >
                  <span className={cn("text-sm font-semibold", d.fecha === hoy && "rounded-full bg-primario px-2 text-primario-texto")}>
                    {Number(d.fecha.slice(8))}
                  </span>
                  <Montos dia={d} corto />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="md:hidden">
        {conMovimientos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-borde p-6 text-center text-sm text-texto-suave">No hay movimientos este mes.</p>
        ) : (
          <ul className="divide-y divide-borde rounded-2xl border border-borde bg-superficie" aria-label="Días con movimientos">
            {conMovimientos.map((d) => (
              <li key={d.fecha}>
                <button
                  type="button"
                  onClick={() => onElegir(d.fecha)}
                  aria-pressed={elegido === d.fecha}
                  aria-label={descripcion(d)}
                  className={cn("flex w-full items-center justify-between gap-3 px-4 py-3 text-left", elegido === d.fecha && "bg-primario/10")}
                >
                  <span className="text-sm font-medium">{fechaLarga(d.fecha)}</span>
                  <Montos dia={d} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
