import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { anularMovimientoSchema } from "compartido/schemas/caja.js";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import TextareaField from "@/componentes/ui/textarea_field.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import { montoConSigno } from "../utils/presentacion.js";

/** Anular no borra: el movimiento queda tachado en el listado con el motivo, y deja de sumar. */
export default function AnularModal({ movimiento, onAnular, onCerrar }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(anularMovimientoSchema), defaultValues: { motivo: "" } });

  async function enviar({ motivo }) {
    setErrorGeneral("");
    try {
      await onAnular({ id: movimiento.id, motivo });
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, ["motivo"]));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Anular movimiento" ocupado={isSubmitting} className="max-w-md">
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
        <p className="text-sm text-texto-suave">
          <strong className="text-texto">{montoConSigno(movimiento.tipo, movimiento.monto)}</strong> · {movimiento.categoria}
          {movimiento.descripcion ? ` · ${movimiento.descripcion}` : ""}. Deja de sumar en el balance, pero queda registrado.
        </p>
        <TextareaField label="Motivo" name="motivo" rows={3} register={register} error={errors.motivo?.message} maxLength={300} />
        <FormError mensaje={errorGeneral} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Anulando..." className="bg-peligro hover:bg-peligro hover:opacity-90">
            Anular
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
