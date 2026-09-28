import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { movimientoCajaSchema } from "compartido/schemas/caja.js";
import { hoyEn } from "compartido/reglas/fechas.js";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import { cn } from "@/utils/cn.js";
import { MEDIOS, TIPOS } from "../utils/presentacion.js";

const CAMPOS = ["tipo", "fecha", "monto", "categoria_id", "medio", "descripcion"];

/**
 * Registrar o editar un ingreso/egreso. `movimiento` = el que se edita (o null);
 * `inicial` = valores sugeridos al crear (ej. el día elegido en el calendario).
 */
export default function MovimientoFormModal({ movimiento = null, inicial = {}, categorias = [], onGuardar, onCerrar }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(movimientoCajaSchema),
    defaultValues: {
      tipo: movimiento?.tipo ?? inicial.tipo ?? "egreso",
      fecha: movimiento?.fecha ?? inicial.fecha ?? hoyEn(),
      monto: movimiento ? String(movimiento.monto).replace(".", ",") : "",
      categoria_id: movimiento?.categoria_id ? String(movimiento.categoria_id) : "",
      medio: movimiento?.medio ?? MEDIOS[0].valor,
      descripcion: movimiento?.descripcion ?? "",
    },
  });
  const tipo = useWatch({ control, name: "tipo" });
  // Solo categorías activas del tipo elegido (más la que ya tenía, aunque se haya desactivado).
  const opciones = categorias
    .filter((c) => c.tipo === tipo && (c.activa || c.id === movimiento?.categoria_id))
    .map((c) => ({ valor: String(c.id), etiqueta: c.nombre }));

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar(movimiento ? { ...datos, id: movimiento.id } : datos);
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, CAMPOS));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={movimiento ? "Editar movimiento" : "Registrar movimiento"} ocupado={isSubmitting}>
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold">Tipo</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {Object.entries(TIPOS).map(([valor, t]) => (
              <label
                key={valor}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
                  tipo === valor ? "border-primario bg-primario/10 font-semibold text-primario" : "border-borde",
                )}
              >
                <input
                  type="radio"
                  value={valor}
                  className="sr-only"
                  {...register("tipo", { onChange: () => setValue("categoria_id", "") })}
                />
                <span className={cn("h-2.5 w-2.5 rounded-full", t.serie)} aria-hidden="true" /> {t.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Fecha" name="fecha" type="date" max={hoyEn()} register={register} error={errors.fecha?.message} required />
          <InputField label="Monto" name="monto" inputMode="decimal" placeholder="0,00" register={register} error={errors.monto?.message} required />
        </div>
        <SelectField
          label="Categoría"
          name="categoria_id"
          register={register}
          opciones={opciones}
          placeholder="Elegí una categoría"
          error={errors.categoria_id?.message}
          required
        />
        <SelectField label="Medio de pago" name="medio" register={register} opciones={MEDIOS} error={errors.medio?.message} required />
        <InputField label="Descripción (opcional)" name="descripcion" register={register} error={errors.descripcion?.message} placeholder="Ej: sueldo de septiembre" maxLength={200} />

        <FormError mensaje={errorGeneral} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
            {movimiento ? "Guardar" : "Registrar"}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
