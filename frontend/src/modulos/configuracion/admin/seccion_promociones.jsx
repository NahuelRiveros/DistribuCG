import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { DIAS_SEMANA } from "compartido/schemas/configuracion.js";
import Boton from "@/componentes/ui/boton.jsx";
import CheckboxField from "@/componentes/ui/checkbox_field.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Seccion from "./seccion.jsx";

const PROMO_NUEVA = { banco: "", detalle: "", dias: [], hasta: "", tope: "", activo: true };

/** Promociones bancarias: se ocultan solas al vencer ("hasta") y se pueden pausar sin borrarlas. */
export default function SeccionPromociones() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "promociones", keyName: "clave" });

  return (
    <Seccion
      titulo="Promociones bancarias"
      descripcion="Sin días marcados, vale todos los días. Al pasar la fecha “hasta”, deja de mostrarse sola."
      accion={
        <Boton variante="secundario" tamano="chico" onClick={() => append({ ...PROMO_NUEVA })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Agregar promoción
        </Boton>
      }
    >
      {fields.length === 0 ? (
        <p className="text-sm text-texto-suave">Sin promociones: la ficha dice “Sin promociones bancarias especiales vigentes en este momento”.</p>
      ) : (
        <ul className="space-y-4">
          {fields.map((promo, i) => {
            const e = errors.promociones?.[i] ?? {};
            return (
              <li key={promo.clave} className="rounded-xl border border-borde p-4">
                <div className="flex items-start gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_2fr]">
                    <InputField label="Banco" name={`promociones.${i}.banco`} register={register} error={e.banco?.message} required />
                    <InputField label="Beneficio" name={`promociones.${i}.detalle`} register={register} error={e.detalle?.message} placeholder="20% de reintegro con tarjeta de crédito" required />
                  </div>
                  <Boton variante="fantasma" tamano="icono" className="mt-6" onClick={() => remove(i)} aria-label={`Quitar la promoción ${i + 1}`} title="Quitar promoción">
                    <Trash2 className="h-4 w-4 text-peligro" />
                  </Boton>
                </div>
                <fieldset className="mt-3">
                  <legend className="text-sm font-semibold">Días</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <label key={dia} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-borde px-2 py-1 text-sm capitalize has-[:checked]:border-primario has-[:checked]:bg-primario/5">
                        <input type="checkbox" value={dia} className="h-4 w-4 accent-[var(--primario)]" {...register(`promociones.${i}.dias`)} />
                        {dia}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
                  <InputField label="Vigente hasta" name={`promociones.${i}.hasta`} type="date" register={register} error={e.hasta?.message} />
                  <InputField label="Tope (opcional)" name={`promociones.${i}.tope`} register={register} error={e.tope?.message} placeholder="Tope $ 10.000 por mes" />
                  <div className="sm:pt-7">
                    <CheckboxField label="Activa" name={`promociones.${i}.activo`} register={register} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Seccion>
  );
}
