import { Link } from "react-router-dom";
import {
  ScanLine,
  Users,
  CreditCard,
  BarChart2,
  Home,
  LogIn,
  Dumbbell,
  Activity,
  Zap,
  Trophy,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

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
    0%, 100% { box-shadow: 0 0 0px rgba(59,130,246,0); }
    50%       { box-shadow: 0 0 22px rgba(59,130,246,0.18); }
  }
`;

const MODULOS = [
  {
    icon: <ScanLine size={13} />,
    code: "MOD-01",
    title: "Control de ingreso",
    text:  "Registro de asistencia por DNI en tiempo real",
  },
  {
    icon: <Users size={13} />,
    code: "MOD-02",
    title: "Gestión de alumnos",
    text:  "Alta, seguimiento y estado de cada alumno",
  },
  {
    icon: <CreditCard size={13} />,
    code: "MOD-03",
    title: "Planes y pagos",
    text:  "Administración de planes vigentes y cobros",
  },
  {
    icon: <BarChart2 size={13} />,
    code: "MOD-04",
    title: "Estadísticas",
    text:  "Asistencia, recaudación y análisis del gimnasio",
  },
];

const LINKS_ACCESO = [
  { icon: <Home     size={11} />, label: "Inicio",          to: "/"                     },
  { icon: <ScanLine size={11} />, label: "Ingreso / Kiosk", to: "/kiosk"                },
  { icon: <LogIn    size={11} />, label: "Iniciar sesión",  to: "/login"                },
  { icon: <Users    size={11} />, label: "Lista de alumnos",to: "/admin/estadisticas/alumnos" },
];

export default function Footer() {
  return (
    <>
      <style>{ANIMATIONS}</style>

      <footer className="relative overflow-hidden bg-[#0B0F1A] text-white">

        {/* ── Capas de fondo ── */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(59,130,246,0.10),transparent),radial-gradient(ellipse_40%_40%_at_100%_0%,rgba(59,130,246,0.07),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:200px_200px]" />

        {/* ── Línea superior animada ── */}
        <div className="relative z-10 h-[2px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-80" />
          <div
            className="absolute inset-y-0 w-32 rounded-full bg-white/70 blur-md"
            style={{ animation: "scanLine 5s ease-in-out infinite" }}
          />
        </div>

        {/* ── Contenido principal ── */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 py-14 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_0.85fr_1fr]">

            {/* ── Marca ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-blue-400"
                    style={{ animation: "statusBlink 2.4s ease-in-out infinite" }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-80" />
                </span>
                <span className="font-mono text-[9px] tracking-[0.35em] text-blue-400/50 uppercase">
                  Sistema activo
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <h3 className="font-mono text-5xl font-black tracking-tighter text-white">
                  Dynamic
                </h3>
                <span className="font-mono text-[10px] font-semibold tracking-widest text-blue-400/70 uppercase">
                  Gym
                </span>
              </div>

              <p className="max-w-[280px] text-sm leading-7 text-slate-400">
                Plataforma de gestión integral para gimnasios. Control de
                ingresos, alumnos, planes y estadísticas en un solo lugar.
              </p>

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/8 px-3.5 py-1.5">
                <ShieldCheck size={10} className="text-blue-400/70" />
                <span className="font-mono text-[9px] tracking-widest text-blue-400/60 uppercase">
                  Gestión · Rendimiento · Control
                </span>
              </div>
            </div>

            {/* ── Módulos ── */}
            <div>
              <SectionHeader label="Módulos del sistema" code="SYS-MOD" />
              <ul className="space-y-3.5">
                {MODULOS.map((m) => (
                  <ModuleItem key={m.code} {...m} />
                ))}
              </ul>
            </div>

            {/* ── Acceso rápido ── */}
            <div>
              <SectionHeader label="Acceso rápido" code="NAV-LNK" />
              <ul className="space-y-1">
                {LINKS_ACCESO.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-400 transition-all duration-150 hover:bg-white/[0.04] hover:text-blue-300"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/8 bg-white/[0.04] text-slate-500 transition-all group-hover:border-blue-400/25 group-hover:text-blue-400">
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight
                        size={10}
                        className="text-blue-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Motivación ── */}
            <div>
              <SectionHeader label="¿Por qué entrenar?" code="GYM-MTV" />

              <ul className="space-y-3">
                {[
                  { icon: <Zap     size={13} />, title: "Explosividad", text: "Potenciá velocidad y reacción" },
                  { icon: <Dumbbell size={13}/>, title: "Fuerza",        text: "Base sólida para cualquier disciplina" },
                  { icon: <Activity size={13}/>, title: "Pliometría",    text: "Energía, coordinación y potencia" },
                  { icon: <Trophy  size={13} />, title: "Rendimiento",   text: "Entrená como un atleta" },
                ].map((item) => (
                  <li key={item.title} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-300">
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white/90">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.text}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div
                className="mt-6 rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-4"
                style={{ animation: "glowPulse 4s ease-in-out infinite" }}
              >
                <p className="font-mono text-[11px] font-semibold tracking-wider text-blue-300 uppercase">
                  Constancia &gt; Motivación
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">
                  El progreso se construye día a día.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Barra inferior ── */}
        <div className="relative z-10 border-t border-white/[0.06]">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-5 sm:flex-row sm:justify-between">
            <p className="font-mono text-[11px] tracking-wide text-slate-500">
              © {new Date().getFullYear()} ·{" "}
              <span className="text-slate-400">Dynamic Gym</span> · Todos los derechos reservados.
            </p>
            <p className="font-mono text-[10px] tracking-widest text-slate-600 uppercase">
              Sistema de gestión · Riveros Edgardo Nahuel
            </p>
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

function ModuleItem({ icon, code, title, text }) {
  return (
    <li className="group flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-300 transition-all duration-200 group-hover:border-blue-400/35 group-hover:bg-blue-400/[0.14]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-600">{code}</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
        <div className="mt-0.5 text-sm font-semibold text-white/90">{title}</div>
        <div className="mt-0.5 text-xs leading-5 text-slate-500">{text}</div>
      </div>
    </li>
  );
}
