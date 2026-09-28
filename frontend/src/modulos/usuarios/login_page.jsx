import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { proyecto } from "compartido/proyecto.js";
import { loginSchema } from "compartido/schemas/auth.js";
import { cliente } from "@/clientes/index.js";
import { mensajeDeError } from "@/api/http.js";
import { linkConRetorno, volverASeguro } from "@/componentes/acceso/volver_a.js";
import InputField from "@/componentes/ui/input_field.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import { useAuth } from "./auth_context.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [errorServidor, setErrorServidor] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", contrasena: "" } });

  async function enviar(datos) {
    setErrorServidor("");
    try {
      await login(datos);
      navigate(volverASeguro(params.get("volver")), { replace: true });
    } catch (error) {
      setErrorServidor(mensajeDeError(error));
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-borde bg-superficie p-6 shadow-sm sm:p-8">
        <h1 className="font-titulos text-2xl font-bold">Ingresar</h1>
        <p className="mt-1 text-sm text-texto-suave">Accedé a tu cuenta de {cliente.marca.nombre}.</p>

        <form onSubmit={handleSubmit(enviar)} noValidate className="mt-6 space-y-4">
          <InputField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            icon={Mail}
            register={register}
            error={errors.email?.message}
            required
          />
          <InputField
            label="Contraseña"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            icon={Lock}
            register={register}
            error={errors.contrasena?.message}
            mostrarContrasena
            required
          />
          <FormError mensaje={errorServidor} />
          <SubmitButton cargando={isSubmitting} textoCargando="Ingresando..." className="w-full">
            Ingresar
          </SubmitButton>
        </form>
        {proyecto.usuarios.registro_publico && (
          <p className="mt-4 text-center text-sm text-texto-suave">
            ¿No tenés cuenta?{" "}
            <Link to={linkConRetorno("/registro", volverASeguro(params.get("volver")))} className="font-semibold text-primario hover:underline">
              Creala acá
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
