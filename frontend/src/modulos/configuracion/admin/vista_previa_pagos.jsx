import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Eye } from "lucide-react";
import { pagosSchema } from "compartido/schemas/configuracion.js";
import MediosPagoSeccion from "@/componentes/pagos/medios_pago_seccion.jsx";
import ResumenPago, { CintaPago } from "@/componentes/pagos/resumen_pago.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { normalizar } from "../utils/formulario_pagos.js";

/** Cómo se ve en la ficha de un producto con lo que se está editando (antes de guardar). Plegada. */
export default function VistaPreviaPagos() {
  const { control } = useFormContext();
  const valores = useWatch({ control });
  const [precio, setPrecio] = useState(10000);
  const resultado = pagosSchema.safeParse(normalizar(valores));

  return (
    <details className="group rounded-2xl border border-dashed border-primario/40 bg-fondo">
      <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-semibold text-primario">
        <Eye className="h-4 w-4" aria-hidden="true" /> Ver cómo queda en la ficha del producto
      </summary>
      <section aria-label="Vista previa en la ficha" className="px-5 pb-5">
        <label className="text-sm">
          <span className="text-texto-suave">Precio de ejemplo </span>
          <input
            type="number"
            min={1}
            value={precio}
            onChange={(e) => setPrecio(Math.max(1, Number(e.target.value) || 1))}
            className="w-32 rounded-lg border border-borde bg-superficie px-2 py-1 tabular-nums"
          />
        </label>
        {resultado.success ? (
          <div className="mt-4 rounded-xl bg-superficie p-4">
            <CintaPago pagos={resultado.data} />
            <p className="mt-3 text-3xl font-bold">{formatearDinero(precio)}</p>
            <ResumenPago precio={precio} pagos={resultado.data} />
            <MediosPagoSeccion precio={precio} pagos={resultado.data} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-texto-suave">Corregí los datos marcados en rojo para ver la vista previa.</p>
        )}
      </section>
    </details>
  );
}
