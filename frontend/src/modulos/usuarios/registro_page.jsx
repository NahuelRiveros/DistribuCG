import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { registroSchema } from "compartido/schemas/auth.js";
import { cliente } from "@/clientes/index.js";
import { linkConRetorno, volverASeguro } from "@/componentes/acceso/volver_a.js";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import { useAuth } from "./auth_context.jsx";

export default function RegistroPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const volver = volverASeguro(params.get("volver"));
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registroSchema), defaultValues: { nombre: "", apellido: "", email: "", contrasena: "" } });

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await registrar(datos);
      navigate(volver, { replace: true });
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, ["nombre", "apellido", "email", "contrasena"]));
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-borde bg-superficie p-6 shadow-sm sm:p-8">
        <h1 className="font-titulos text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-texto-suave">Para hacer pedidos en {cliente.marca.nombre}.</p>
        <form onSubmit={handleSubmit(enviar)} noValidate className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Nombre" name="nombre" autoComplete="given-name" icon={User} register={register} error={errors.nombre?.message} required />
            <InputField label="Apellido" name="apellido" autoComplete="family-name" register={register} error={errors.apellido?.message} />
          </div>
          <InputField label="Email" name="email" type="email" autoComplete="email" icon={Mail} register={register} error={errors.email?.message} required />
          <InputField label="Contraseña" name="contrasena" type="password" autoComplete="new-password" icon={Lock} register={register} error={errors.contrasena?.message} mostrarContrasena required />
          <FormError mensaje={errorGeneral} />
          <SubmitButton cargando={isSubmitting} textoCargando="Creando cuenta..." className="w-full">
            Crear cuenta
          </SubmitButton>
        </form>
        <p className="mt-4 text-center text-sm text-texto-suave">
          ¿Ya tenés cuenta?{" "}
          <Link to={linkConRetorno("/login", volver)} className="font-semibold text-primario hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </section>
  );
}
