import { CreditCard, Landmark, Sparkles } from "lucide-react";
import { cintaDestacada, conDescuento, mejorCuotaSinInteres, mejorDescuento } from "compartido/reglas/pagos.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";

/** Cinta vendedora de la ficha (la configurada o la armada con lo mejor disponible). */
export function CintaPago({ pagos }) {
  const texto = cintaDestacada(pagos);
  if (!texto) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl bg-acento/10 px-3 py-2 text-sm font-semibold text-acento">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {texto}
    </p>
  );
}

/** Debajo del precio: el precio con el mejor descuento y la mejor cuota sin interés, calculados sobre ese precio. */
export default function ResumenPago({ precio, pagos }) {
  const descuento = mejorDescuento(pagos);
  const cuota = mejorCuotaSinInteres(precio, pagos);
  if (!descuento && !cuota) return null;

  return (
    <ul className="mt-3 space-y-1 text-sm">
      {descuento && (
        <li className="flex items-center gap-2">
          <Landmark className="h-4 w-4 shrink-0 text-texto-suave" aria-hidden="true" />
          <span>
            <strong className="tabular-nums" data-testid="precio-con-descuento">
              {formatearDinero(conDescuento(precio, descuento.descuento).total)}
            </strong>{" "}
            con {descuento.etiqueta.toLowerCase()} <span className="text-texto-suave">({descuento.descuento}% OFF)</span>
          </span>
        </li>
      )}
      {cuota && cuota.cuotas > 1 && (
        <li className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 shrink-0 text-texto-suave" aria-hidden="true" />
          <span>
            <strong>{cuota.cuotas} cuotas sin interés</strong> de <span className="tabular-nums">{formatearDinero(cuota.valor_cuota)}</span>
          </span>
        </li>
      )}
    </ul>
  );
}
