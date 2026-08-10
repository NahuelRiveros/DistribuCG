import { useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Users, Wallet, HeartPulse } from "lucide-react";

import InputField from "../components/form/input_field.jsx";
import FormError from "../components/form/form_error.jsx";
import WelcomeModal from "../components/modal/welcome_modal.jsx";
import LogoMoovs from "../components/brand/logo_moovs.jsx";

import { useAuth } from "../auth/auth_context.jsx";
import { authConfig } from "../config/auth_config.js";
import { brandConfig } from "../config/brand_config.js";

const FEATURES = [
  // {
  //   icon: Users,
  //   titulo: "Alumnos y planes",
  //   detalle: "Altas, vencimientos y seguimiento de cada plan.",
  // },
  // {
  //   icon: Wallet,
  //   titulo: "Pagos y accesos",
  //   detalle: "Cobros y control de ingreso por DNI en el gimnasio.",
  // },
  // {
  //   icon: HeartPulse,
  //   titulo: "Kinesiología",
  //   detalle: "Pacientes, patologías y sesiones en un mismo lugar.",
  // },
];

export default function LoginPage() {
  const nav = useNavigate();
  const { login, user } = useAuth();

  const [error, setError] = useState(null);
  const [mostrarWelcome, setMostrarWelcome] = useState(false);

  const labels = authConfig?.loginCampos || {
    emailLabel: "Email",
    passwordLabel: "Contraseña",
    botonLabel: "Ingresar",
  };

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, "El email es obligatorio")
          .email("Email inválido"),
        password: z
          .string()
          .trim()
          .min(4, "Mínimo 4 caracteres"),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setError(null);

    try {
      await login(values);
      setMostrarWelcome(true);
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          err?.message ||
          "No se pudo iniciar sesión"
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--kt-bg-soft)">
      <div className="kt-dotgrid absolute inset-0 opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(135,199,232,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(36,52,71,0.10),_transparent_38%)]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-(--kt-turquoise) via-(--kt-petrol) to-(--kt-turquoise)" />

      <div className="relative z-[var(--z-content)] grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <NavLink to="/" className="inline-flex w-fit items-center">
            <LogoMoovs size="sm" />
          </NavLink>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-(--kt-turquoise-border) bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-(--kt-teal-700) shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-(--kt-turquoise)" />
              Panel del equipo
            </div>

            <h1 className="kt-display mt-6 text-4xl font-extrabold leading-[1.12] text-slate-900 xl:text-5xl">
              Gestioná Moovs
              <br />
              desde un solo panel.
            </h1>

            <p className="mt-4 max-w-md text-base leading-7 text-(--kt-ink-soft)">
              Turnos, planes, pagos y seguimiento kinesiológico — todo
              centralizado para vos y el resto del equipo.
            </p>

            <div className="mt-9 space-y-3">
              {FEATURES.map((f) => (
                <div
                  key={f.titulo}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm backdrop-blur"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--kt-turquoise-soft) text-(--kt-teal-700)">
                    <f.icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">{f.titulo}</p>
                    <p className="truncate text-xs text-slate-500">{f.detalle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="kt-display text-sm italic text-(--kt-ink-mute)">
            {brandConfig.tagline}
          </p>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <LogoMoovs size="sm" />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/5">
              <div className="h-1 bg-linear-to-r from-(--kt-turquoise) via-(--kt-petrol) to-(--kt-turquoise)" />

              <div className="p-7 sm:p-8">
                <h2 className="kt-display text-2xl font-extrabold text-slate-900">
                  Iniciar sesión
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ingresá con tu usuario del equipo para continuar.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                  <InputField
                    label={labels.emailLabel}
                    name="email"
                    register={register}
                    error={errors?.email?.message}
                    placeholder="admin@gym.com"
                    type="email"
                    autoComplete="username"
                    className="py-3"
                  />

                  <InputField
                    label={labels.passwordLabel}
                    name="password"
                    register={register}
                    error={errors?.password?.message}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    showPasswordToggle
                    className="py-3"
                  />

                  <FormError message={error} />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--kt-teal-700) py-3 text-sm font-bold text-white shadow-sm shadow-(--kt-turquoise)/25 transition-all hover:bg-(--kt-petrol) active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isSubmitting ? "Ingresando…" : labels.botonLabel}
                  </button>
                </form>

                <div className="mt-6 flex justify-center border-t border-slate-100 pt-5">
                  <a
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-(--kt-teal-700)"
                  >
                    <ArrowLeft size={14} />
                    Volver al inicio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarWelcome && (
        <WelcomeModal
          nombre={user?.nombre}
          apellido={user?.apellido}
          onFinish={() => {
            setMostrarWelcome(false);
            nav("/");
          }}
        />
      )}
    </div>
  );
}
