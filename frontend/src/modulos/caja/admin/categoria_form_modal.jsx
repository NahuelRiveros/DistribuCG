import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoriaCajaSchema } from "compartido/schemas/caja.js";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import { TIPOS } from "../utils/presentacion.js";

/** Nueva categoría de un tipo (categoria = null) o renombrar una existente. */
export default function CategoriaFormModal({ tipo, categoria = null, onGuardar, onCerrar }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(categoriaCajaSchema), defaultValues: { tipo, nombre: categoria?.nombre ?? "" } });

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar(categoria ? { id: categoria.id, nombre: datos.nombre } : datos);
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, ["nombre"]));
    }
  }

  const titulo = categoria ? "Renombrar categoría" : `Nueva categoría de ${TIPOS[tipo].plural.toLowerCase()}`;
  return (
    <Modal abierto onCerrar={onCerrar} titulo={titulo} ocupado={isSubmitting} className="max-w-md">
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
        <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} required autoFocus maxLength={60} />
        <FormError mensaje={errorGeneral} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
            Guardar
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
