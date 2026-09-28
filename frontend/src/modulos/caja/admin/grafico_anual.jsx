import { useState } from "react";
import { Link } from "react-router-dom";
import { MESES } from "compartido/reglas/fechas.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { cn } from "@/utils/cn.js";
import { montoCorto, saldoTexto, TIPOS } from "../utils/presentacion.js";

const ALTO = 200; // px del área de barras

/** Tope "redondo" del eje (1, 2 o 5 × 10^n) para que las guías tengan valores legibles. */
function topeEje(maximo) {
  if (maximo <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  return [1, 2, 5, 10].map((m) => m * potencia).find((v) => v >= maximo);
}

function Barras({ anio, meses, maximo }) {
  const [activo, setActivo] = useState(null);
  const tope = topeEje(maximo);
  const guias = [tope, tope / 2, 0];
  const alto = (valor) => (valor > 0 ? Math.max(2, (valor / tope) * ALTO) : 0);

  return (
    <div className="mt-4 flex gap-2">
      {/* Eje: pocas guías, recesivas */}
      <div className="relative w-12 shrink-0 text-right text-xs text-texto-suave" style={{ height: ALTO }} aria-hidden="true">
        {guias.map((v) => (
          <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: ALTO - (v / tope) * ALTO }}>
            {montoCorto(v)}
          </span>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        {guias.map((v) => (
          <div key={v} className="absolute inset-x-0 border-t border-borde" style={{ top: ALTO - (v / tope) * ALTO }} aria-hidden="true" />
        ))}
        <ol className="relative flex items-end" style={{ height: ALTO }}>
          {meses.map((m) => (
            <li key={m.mes} className="relative flex h-full flex-1 justify-center">
              <Link
                to={`/admin/caja/calendario?anio=${anio}&mes=${m.mes}`}
                onMouseEnter={() => setActivo(m.mes)}
                onMouseLeave={() => setActivo(null)}
                onFocus={() => setActivo(m.mes)}
                onBlur={() => setActivo(null)}
                aria-label={`${MESES[m.mes - 1]}: ingresos ${formatearDinero(m.ingresos)}, egresos ${formatearDinero(m.egresos)}. Ver calendario`}
                className={cn("flex h-full w-full items-end justify-center gap-0.5 rounded-t-md px-0.5", activo === m.mes && "bg-fondo")}
              >
                <span className="w-full max-w-6 rounded-t bg-serie-1" style={{ height: alto(m.ingresos) }} />
                <span className="w-full max-w-6 rounded-t bg-serie-2" style={{ height: alto(m.egresos) }} />
              </Link>
              {activo === m.mes && (
                <div
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-2 w-44 rounded-xl border border-borde bg-superficie p-3 text-xs shadow-lg",
                    m.mes <= 2 ? "left-0" : m.mes >= 11 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                >
                  <p className="font-semibold">
                    {MESES[m.mes - 1]} {anio}
                  </p>
                  <p className="mt-1 flex justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-texto-suave">
                      <span className="h-2 w-2 rounded-sm bg-serie-1" aria-hidden="true" /> Ingresos
                    </span>
                    <span className="tabular-nums">{formatearDinero(m.ingresos)}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-texto-suave">
                      <span className="h-2 w-2 rounded-sm bg-serie-2" aria-hidden="true" /> Egresos
                    </span>
                    <span className="tabular-nums">{formatearDinero(m.egresos)}</span>
                  </p>
                  <p className="mt-1 flex justify-between gap-2 border-t border-borde pt-1 font-semibold">
                    <span>Saldo</span>
                    <span className="tabular-nums">{saldoTexto(m.saldo)}</span>
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
        <ol className="flex text-center text-xs text-texto-suave" aria-hidden="true">
          {meses.map((m) => (
            <li key={m.mes} className="flex-1 pt-1">
              {/* En celular no entran 12 abreviaturas: solo la inicial */}
              <span className="sm:hidden">{MESES[m.mes - 1][0]}</span>
              <span className="hidden sm:inline">{MESES[m.mes - 1].slice(0, 3)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/**
 * Barras agrupadas por mes: ingresos (serie 1) y egresos (serie 2). Cada mes es un link al
 * calendario; al pasar el mouse o enfocarlo con el teclado muestra el detalle.
 * La tabla de meses de la página es la vista accesible con los mismos datos.
 */
export default function GraficoAnual({ anio, meses }) {
  const maximo = Math.max(...meses.flatMap((m) => [m.ingresos, m.egresos]));

  return (
    <figure className="rounded-2xl border border-borde bg-superficie p-4">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">Ingresos y egresos por mes</span>
        <span className="flex gap-4 text-sm text-texto-suave">
          {Object.values(TIPOS).map((t) => (
            <span key={t.plural} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-sm", t.serie)} aria-hidden="true" /> {t.plural}
            </span>
          ))}
        </span>
      </figcaption>

      {maximo === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-borde px-4 py-12 text-center text-sm text-texto-suave">
          Todavía no hay ingresos ni egresos en {anio}.
        </p>
      ) : (
        <Barras anio={anio} meses={meses} maximo={maximo} />
      )}
    </figure>
  );
}
