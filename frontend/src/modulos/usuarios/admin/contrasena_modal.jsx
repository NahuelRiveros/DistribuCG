import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usuarioContrasenaSchema } from "compartido/schemas/usuarios.js";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";

/** Cambiar la contraseña de otro usuario (ej. si se la olvidó). Cierra sus sesiones abiertas. */
export default function ContrasenaModal({ usuario, onGuardar, onCerrar }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(usuarioContrasenaSchema), defaultValues: { contrasena: "", confirmar: "" } });

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar({ ...datos, id: usuario.id });
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, ["contrasena", "confirmar"]));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Cambiar contraseña" ocupado={isSubmitting} className="max-w-md">
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
        <p className="text-sm text-texto-suave">
          Nueva contraseña para <strong className="text-texto">{usuario.email}</strong>. Si tenía una sesión abierta, se le va a cerrar.
        </p>
        <InputField label="Nueva contraseña" name="contrasena" type="password" autoComplete="new-password" register={register} error={errors.contrasena?.message} required autoFocus />
        <InputField label="Repetir contraseña" name="confirmar" type="password" autoComplete="new-password" register={register} error={errors.confirmar?.message} required />
        <FormError mensaje={errorGeneral} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
            Cambiar contraseña
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
