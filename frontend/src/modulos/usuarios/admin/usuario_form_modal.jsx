import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usuarioCrearSchema, usuarioEditarSchema } from "compartido/schemas/usuarios.js";
import { ROLES_ASIGNABLES, rolesQuePuedeAsignar } from "compartido/reglas/usuarios.js";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";

const AYUDA_ROL = {
  admin: "Todo el panel, incluido crear personal.",
  staff: "El panel (catálogo, stock y pedidos), sin la sección Usuarios.",
  cliente: "Solo la tienda: sin acceso al panel.",
};

/** Alta (usuario = null) o edición de un usuario. La contraseña se pide solo al crear. */
export default function UsuarioFormModal({ usuario = null, onGuardar, onCerrar }) {
  const { usuario: actor } = useAuth();
  const [errorGeneral, setErrorGeneral] = useState("");
  const opcionesRol = rolesQuePuedeAsignar(actor).map((valor) => ({ valor, etiqueta: ROLES_ASIGNABLES[valor] }));
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(usuario ? usuarioEditarSchema : usuarioCrearSchema),
    defaultValues: {
      nombre: usuario?.nombre ?? "",
      apellido: usuario?.apellido ?? "",
      email: usuario?.email ?? "",
      rol: usuario?.rol ?? "staff",
      ...(usuario ? {} : { contrasena: "" }),
    },
  });

  const rolElegido = useWatch({ control, name: "rol" });

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar(usuario ? { ...datos, id: usuario.id } : datos);
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, ["nombre", "apellido", "email", "rol", "contrasena"]));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={usuario ? "Editar usuario" : "Nuevo usuario"} ocupado={isSubmitting}>
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} required autoFocus />
          <InputField label="Apellido" name="apellido" register={register} error={errors.apellido?.message} />
        </div>
        <InputField label="Email" name="email" type="email" autoComplete="off" register={register} error={errors.email?.message} required />
        <SelectField label="Rol" name="rol" register={register} opciones={opcionesRol} error={errors.rol?.message} required />
        <p className="-mt-2 text-xs text-texto-suave">{AYUDA_ROL[rolElegido]}</p>
        {!usuario && (
          <InputField
            label="Contraseña inicial"
            name="contrasena"
            type="password"
            autoComplete="new-password"
            register={register}
            error={errors.contrasena?.message}
            ayuda="Pasásela a la persona; después la puede cambiar."
            required
          />
        )}
        <FormError mensaje={errorGeneral} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
            {usuario ? "Guardar" : "Crear usuario"}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
