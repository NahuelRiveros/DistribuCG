import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, ArrowLeft } from "lucide-react";

import InputField from "../../controls/ui/input_field.jsx";
import FormError from "../../controls/ui/form_error.jsx";
import LogoMoovs from "../../controls/brand/logo_moovs.jsx";

import { authRegister } from "../../api/auth_api.js";
import { registroConfig } from "../../config/auth_config.js";

const schema = z
  .object({
    nombre: z.string().trim().min(2, "Nombre muy corto"),
    apellido: z.string().trim().min(2, "Apellido muy corto"),
    email: z.string().trim().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmarPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

export default function RegisterPage() {
  const nav = useNavigate();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", apellido: "", email: "", password: "", confirmarPassword: "" },
  });

  async function onSubmit(values) {
    setError(null);
    try {
      const { confirmarPassword: _confirmarPassword, ...payload } = values;
      const r = await authRegister(payload);
      if (r?.ok === false) { setError(r?.mensaje || "No se pudo registrar"); return; }
      nav("/login");
    } catch (err) {
      setError(err?.response?.data?.mensaje || err?.message || "Error inesperado al registrar");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--kt-bg-soft)">
      <div className="kt-dotgrid absolute inset-0 opacity-70" />
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-(--kt-turquoise) via-(--kt-petrol) to-(--kt-turquoise)" />

      <div className="relative z-[var(--z-content)] flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <NavLink to="/">
              <LogoMoovs size="sm" />
            </NavLink>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/5">
            <div className="h-1 bg-linear-to-r from-(--kt-turquoise) via-(--kt-petrol) to-(--kt-turquoise)" />

            <div className="p-7 sm:p-8">
              <h1 className="kt-display text-2xl font-extrabold text-slate-900">{registroConfig.titulo}</h1>
              <p className="mt-1 text-sm text-slate-500">{registroConfig.subtitulo}</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Nombre"
                    name="nombre"
                    register={register}
                    error={errors?.nombre?.message}
                    placeholder="Juan"
                  />
                  <InputField
                    label="Apellido"
                    name="apellido"
                    register={register}
                    error={errors?.apellido?.message}
                    placeholder="Pérez"
                  />
                </div>

                <InputField
                  label="Email"
                  name="email"
                  register={register}
                  error={errors?.email?.message}
                  placeholder="juan@mail.com"
                  type="email"
                  autoComplete="email"
                />

                <InputField
                  label="Contraseña"
                  name="password"
                  register={register}
                  error={errors?.password?.message}
                  placeholder="••••••••"
                  type="password"
                  showPasswordToggle
                />

                <InputField
                  label="Confirmar contraseña"
                  name="confirmarPassword"
                  register={register}
                  error={errors?.confirmarPassword?.message}
                  placeholder="••••••••"
                  type="password"
                  showPasswordToggle
                />

                <FormError message={error} />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--kt-teal-700) py-3 text-sm font-bold text-white shadow-sm shadow-(--kt-turquoise)/25 transition-all hover:bg-(--kt-petrol) active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
                >
                  <UserPlus size={16} />
                  {isSubmitting ? "Registrando…" : registroConfig.botonLabel}
                </button>
              </form>

              <div className="mt-6 flex justify-center border-t border-slate-100 pt-5">
                <NavLink
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-(--kt-teal-700)"
                >
                  <ArrowLeft size={14} />
                  Ya tengo cuenta, iniciar sesión
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
