import { ShieldCheck } from "lucide-react";
import { footer_config } from "./footer_config.jsx";
import { moduloHabilitado } from "../../config/modulos_config.js";
import { useAuth } from "../../auth/auth_context.jsx";

const ANIMATIONS = `
  @keyframes scanLine {
    0%   { transform: translateX(-100%); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(100vw); opacity: 0; }
  }
  @keyframes statusBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.15; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 0px rgba(24,199,216,0); }
    50%       { box-shadow: 0 0 22px rgba(24,199,216,0.18); }
  }
`;

export default function Footer() {
  const { marca, enfoque, diferenciales, callout, legal } = footer_config;
  const { modulosHabilitados } = useAuth();

  const activo = (item) => item.habilitado && moduloHabilitado(item.modulo, modulosHabilitados);

  const enfoqueActivo        = enfoque.filter(activo);
  const diferencialesActivos = diferenciales.filter(activo);

  return (
    <>
      <style>{ANIMATIONS}</style>

      <footer className="relative overflow-hidden bg-[#0B0F1A] text-white">

        {/* ── Capas de fondo ── */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(24,199,216,0.10),transparent),radial-gradient(ellipse_40%_40%_at_100%_0%,rgba(24,199,216,0.07),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:200px_200px]" />

        {/* ── Línea superior animada ── */}
        <div className="relative z-[var(--z-content)] h-[2px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--kt-petrol)] via-[var(--kt-turquoise)] to-[var(--kt-petrol)] opacity-80" />
          <div
            className="absolute inset-y-0 w-32 rounded-full bg-white/70 blur-md"
            style={{ animation: "scanLine 5s ease-in-out infinite" }}
          />
        </div>

        {/* ── Contenido principal ── */}
        <div className="relative z-[var(--z-content)] mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 py-14 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">

            {/* ── Marca ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-[var(--kt-turquoise)]"
                    style={{ animation: "statusBlink 2.4s ease-in-out infinite" }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--kt-turquoise)] opacity-80" />
                </span>
                <span className="font-mono text-[9px] tracking-[0.35em] text-[var(--kt-turquoise)]/50 uppercase">
                  {marca.estadoLabel}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <h3 className="kt-display text-5xl font-bold tracking-tighter text-white">
                  {marca.nombre}
                </h3>
              </div>

              <p className="max-w-[280px] text-sm leading-7 text-slate-400">
                {marca.tagline}
              </p>

              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--kt-turquoise)]/20 bg-[var(--kt-turquoise)]/8 px-3.5 py-1.5">
                <ShieldCheck size={10} className="text-[var(--kt-turquoise)]/70" />
                <span className="font-mono text-[9px] tracking-widest text-[var(--kt-turquoise)]/60 uppercase">
                  {marca.selloLabel}
                </span>
              </div>
            </div>

            {/* ── Nuestro enfoque ── */}
            {enfoqueActivo.length > 0 && (
              <div>
                <SectionHeader label="Nuestro enfoque" code="KT-WHY" />
                <ul className="space-y-3.5">
                  {enfoqueActivo.map((m) => (
                    <EnfoqueItem key={m.codigo} {...m} />
                  ))}
                </ul>
              </div>
            )}

            {/* ── Motivación ── */}
            {diferencialesActivos.length > 0 && (
              <div>
                <SectionHeader label="¿Por qué elegirnos?" code="KT-PLR" />

                <ul className="space-y-3">
                  {diferencialesActivos.map((item) => (
                    <li key={item.titulo} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[var(--kt-turquoise)]/15 bg-[var(--kt-turquoise)]/[0.08] text-[var(--kt-turquoise)]">
                        <item.icon size={13} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white/90">{item.titulo}</div>
                        <div className="text-xs text-slate-500">{item.texto}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {callout && (
                  <div
                    className="mt-6 rounded-2xl border border-[var(--kt-turquoise)]/15 bg-[var(--kt-turquoise)]/[0.06] p-4"
                    style={{ animation: "glowPulse 4s ease-in-out infinite" }}
                  >
                    <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--kt-turquoise)] uppercase">
                      {callout.titulo}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-300">
                      {callout.texto}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Barra inferior ── */}
        <div className="relative z-[var(--z-content)] border-t border-white/[0.06]">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-5 sm:flex-row sm:justify-between">
            <p className="font-mono text-[11px] tracking-wide text-slate-500">
              © {new Date().getFullYear()} ·{" "}
              <span className="text-slate-400">{legal.nombreDerechos}</span> · Todos los derechos reservados.
            </p>
            {legal.mostrarDesarrolladoPor && (
              <p className="font-mono text-[10px] tracking-widest text-slate-600 uppercase">
                Sistema de gestión · {legal.desarrolladoPor}
              </p>
            )}
          </div>
        </div>

      </footer>
    </>
  );
}

function SectionHeader({ label, code }) {
  return (
    <div className="mb-5 flex items-baseline gap-2 border-b border-white/[0.06] pb-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
        {label}
      </h4>
      <span className="font-mono text-[9px] text-slate-600">[{code}]</span>
    </div>
  );
}

function EnfoqueItem({ icon, code, titulo, texto }) {
  const Icon = icon;
  return (
    <li className="group flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--kt-turquoise)]/15 bg-[var(--kt-turquoise)]/[0.08] text-[var(--kt-turquoise)] transition-all duration-200 group-hover:border-[var(--kt-turquoise)]/35 group-hover:bg-[var(--kt-turquoise)]/[0.14]">
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-600">{code}</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
        <div className="mt-0.5 text-sm font-semibold text-white/90">{titulo}</div>
        <div className="mt-0.5 text-xs leading-5 text-slate-500">{texto}</div>
      </div>
    </li>
  );
}
