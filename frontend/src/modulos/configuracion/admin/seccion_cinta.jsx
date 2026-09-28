import { useFormContext, useWatch } from "react-hook-form";
import { pagosSchema } from "compartido/schemas/configuracion.js";
import { cintaDestacada } from "compartido/reglas/pagos.js";
import CheckboxField from "@/componentes/ui/checkbox_field.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import { normalizar } from "../utils/formulario_pagos.js";
import Seccion from "./seccion.jsx";

/** La línea vendedora junto al precio: automática (con lo mejor configurado) o un texto propio. */
export default function SeccionCinta() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const valores = useWatch({ control });
  const resultado = pagosSchema.safeParse({ ...normalizar(valores), cinta: null });
  const automatica = resultado.success ? cintaDestacada(resultado.data) : null;

  return (
    <Seccion titulo="Cinta destacada" descripcion="La línea que se destaca junto al precio en la ficha del producto.">
      <p className="rounded-lg bg-fondo px-3 py-2 text-sm">
        <span className="text-texto-suave">Automática: </span>
        {automatica ?? <span className="text-texto-suave">(sin cuotas sin interés ni descuentos, no se muestra)</span>}
      </p>
      <div className="mt-3">
        <CheckboxField label="Usar un texto propio" name="cinta_personalizada" register={register} />
      </div>
      {valores.cinta_personalizada && (
        <div className="mt-3">
          <InputField label="Texto de la cinta" name="cinta" register={register} error={errors.cinta?.message} maxLength={160} placeholder="¡Envío gratis a todo el país esta semana!" />
        </div>
      )}
    </Seccion>
  );
}
