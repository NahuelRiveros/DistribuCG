import { proyecto } from "compartido/proyecto.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";

/**
 * Resumen de importes. Con precios con IVA, el IVA se informa como "incluido".
 * `descuento` (por medio de pago) se muestra restando; `total` ya viene descontado.
 */
export default function Totales({ subtotal_neto, iva, total, descuento = 0, etiquetaDescuento = "Descuento" }) {
  const conIva = proyecto.tienda.precios_con_iva;
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between text-texto-suave">
        <dt>Subtotal sin IVA</dt>
        <dd className="tabular-nums">{formatearDinero(subtotal_neto)}</dd>
      </div>
      <div className="flex justify-between text-texto-suave">
        <dt>{conIva ? "IVA incluido" : "IVA"}</dt>
        <dd className="tabular-nums">{formatearDinero(iva)}</dd>
      </div>
      {Number(descuento) > 0 && (
        <div className="flex justify-between font-semibold text-emerald-700">
          <dt>{etiquetaDescuento}</dt>
          <dd className="tabular-nums" data-testid="descuento">
            − {formatearDinero(descuento)}
          </dd>
        </div>
      )}
      <div className="flex justify-between border-t border-borde pt-2 text-lg font-bold">
        <dt>Total</dt>
        <dd className="tabular-nums" data-testid="total">
          {formatearDinero(total)}
        </dd>
      </div>
    </dl>
  );
}
