import { useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";
import Boton from "@/componentes/ui/boton.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import CheckboxField from "@/componentes/ui/checkbox_field.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { leyendaIva, precioVisible } from "../utils/precios.js";
import { presentacionVacia } from "./producto_form_valores.js";

const { etiqueta_variante, etiqueta_variantes, alicuotas_iva } = proyecto.catalogo;
const OPCIONES_IVA = alicuotas_iva.map((a) => ({ valor: a, etiqueta: `${String(a).replace(".", ",")} %` }));

function PrecioFinal({ control, indice }) {
  const [precio, iva] = useWatch({ control, name: [`variantes.${indice}.precio`, `variantes.${indice}.iva_porcentaje`] });
  const numero = Number(String(precio ?? "").replace(",", "."));
  const valido = precio !== "" && Number.isFinite(numero) && numero >= 0;
  return (
    <p className="text-sm text-texto-suave" aria-live="polite">
      Precio en tienda: <strong className="text-texto">{valido ? formatearDinero(precioVisible(numero, iva)) : "—"}</strong> ({leyendaIva})
    </p>
  );
}

export default function PresentacionesEditor({ control, register, errors }) {
  // keyName "clave": el campo "id" es el id real de la presentación en la base.
  const { fields, append, remove } = useFieldArray({ control, name: "variantes", keyName: "clave" });
  const errorGeneral = errors.variantes?.message ?? errors.variantes?.root?.message;

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{etiqueta_variantes}</h2>
          <p className="text-sm text-texto-suave">Cada {etiqueta_variante.toLowerCase()} tiene su código y su precio. Precio neto, sin IVA.</p>
        </div>
        <Boton variante="secundario" tamano="chico" onClick={() => append(presentacionVacia())}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Agregar {etiqueta_variante.toLowerCase()}
        </Boton>
      </div>
      {errorGeneral && <p className="mt-2 text-sm text-peligro">{errorGeneral}</p>}

      <ol className="mt-4 space-y-4">
        {fields.map((campo, i) => {
          const err = errors.variantes?.[i] ?? {};
          return (
            <li key={campo.clave} className="rounded-xl border border-borde p-4" aria-label={`${etiqueta_variante} ${i + 1}`}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1fr_0.8fr_1fr]">
                <InputField label="Nombre" name={`variantes.${i}.nombre`} register={register} error={err.nombre?.message} placeholder="Ej: 500 g, Pack x6" />
                <InputField label="Código / SKU" name={`variantes.${i}.sku`} register={register} error={err.sku?.message} />
                <InputField label="Precio neto" name={`variantes.${i}.precio`} register={register} error={err.precio?.message} inputMode="decimal" required />
                <SelectField label="IVA" name={`variantes.${i}.iva_porcentaje`} register={register} opciones={OPCIONES_IVA} error={err.iva_porcentaje?.message} />
                <InputField label="Precio anterior" name={`variantes.${i}.precio_anterior`} register={register} error={err.precio_anterior?.message} inputMode="decimal" ayuda="Opcional, para oferta" />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <PrecioFinal control={control} indice={i} />
                <div className="flex items-center gap-4">
                  <CheckboxField label="A la venta" name={`variantes.${i}.activo`} register={register} />
                  <Boton variante="fantasma" tamano="chico" onClick={() => remove(i)} disabled={fields.length === 1} aria-label={`Quitar ${etiqueta_variante.toLowerCase()} ${i + 1}`}>
                    <Trash2 className="h-4 w-4 text-peligro" aria-hidden="true" /> Quitar
                  </Boton>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
