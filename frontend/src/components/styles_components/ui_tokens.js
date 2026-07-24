/**
 * Tokens de diseño centralizados — Sistema RAV
 *
 * Fuente única de verdad visual para todo el sistema.
 * Todos los componentes deben importar desde aquí en lugar
 * de hardcodear clases Tailwind repetidas.
 *
 * Paleta: fondo oscuro · acento cyan · acento naranja
 * CSS vars del sistema: --rav-bg | --rav-card-bg | --rav-table-bg
 */

// ─── Fondos ─────────────────────────────────────────────────────────────────
export const BG = {
  page:    "bg-[var(--rav-bg)]",
  card:    "bg-[var(--rav-card-bg)]",
  table:   "bg-[var(--rav-table-bg)]",
  surface: "bg-white/5",
  overlay: "bg-slate-950/80",
};

// ─── Bordes ──────────────────────────────────────────────────────────────────
export const BORDER = {
  card:    "border border-cyan-400/20",
  base:    "border border-white/10",
  subtle:  "border border-white/[0.06]",
  input:   "border border-cyan-400/40",
  dashed:  "border border-dashed border-white/15",
  section: "border border-white/[0.07]",
};

// ─── Radios ──────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   "rounded-xl",
  md:   "rounded-2xl",
  lg:   "rounded-3xl",
  card: "rounded-[28px]",
  full: "rounded-full",
};

// ─── Sombras ─────────────────────────────────────────────────────────────────
export const SHADOW = {
  card:  "shadow-[0_4px_32px_rgba(0,0,0,0.45),0_0_60px_rgba(34,211,238,0.06)]",
  table: "shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(34,211,238,0.03)]",
  modal: "shadow-[0_0_50px_rgba(34,211,238,0.12)]",
  panel: "shadow-[0_2px_16px_rgba(0,0,0,0.3)]",
};

// ─── Tipografía ──────────────────────────────────────────────────────────────
export const TEXT = {
  pageTitle:   "text-2xl font-black tracking-tight text-white sm:text-3xl",
  sectionTitle:"text-lg font-bold text-white",
  cardTitle:   "text-base font-semibold text-white",
  subtitle:    "text-sm leading-6 text-slate-300",
  body:        "text-sm text-slate-300",
  muted:       "text-sm text-slate-400",
  label:       "text-sm font-semibold text-white",
  mono:        "font-mono text-xs text-slate-400 uppercase tracking-wider",
  helper:      "text-xs text-slate-500",
};

// ─── Layout de página ────────────────────────────────────────────────────────
export const LAYOUT = {
  pageShell:   "mx-auto w-full max-w-7xl px-4 py-6 space-y-6 sm:px-6 lg:px-8",
  pageMd:      "mx-auto w-full max-w-4xl px-4 py-6 space-y-6 sm:px-6 lg:px-8",
  pageSm:      "mx-auto w-full max-w-2xl px-4 py-6 space-y-6 sm:px-6 lg:px-8",
  pageFull:    "w-full px-4 py-6 space-y-6 sm:px-6 lg:px-8",
};

// ─── Glows decorativos ───────────────────────────────────────────────────────
export const GLOW = {
  card:   "absolute inset-0 rounded-[28px] bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(34,211,238,0.08),transparent)] pointer-events-none",
  table:  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,rgba(255,110,35,0.08),transparent_55%),radial-gradient(ellipse_50%_45%_at_100%_100%,rgba(34,211,238,0.06),transparent_55%)]",
  header: "absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(34,211,238,0.05),transparent)] pointer-events-none",
};

// ─── Variantes de color para badges/alerts/botones ──────────────────────────
export const VARIANT_COLORS = {
  cyan:    { border: "border-cyan-400/30",    bg: "bg-cyan-400/10",    text: "text-cyan-300"    },
  orange:  { border: "border-orange-400/30",  bg: "bg-orange-400/10",  text: "text-orange-300"  },
  success: { border: "border-emerald-400/30", bg: "bg-emerald-400/10", text: "text-emerald-300" },
  danger:  { border: "border-rose-400/30",    bg: "bg-rose-400/10",    text: "text-rose-300"    },
  warning: { border: "border-amber-400/30",   bg: "bg-amber-400/10",   text: "text-amber-300"   },
  purple:  { border: "border-purple-400/30",  bg: "bg-purple-400/10",  text: "text-purple-300"  },
  blue:    { border: "border-blue-400/30",    bg: "bg-blue-400/10",    text: "text-blue-300"    },
  green:   { border: "border-green-400/30",   bg: "bg-green-400/10",   text: "text-green-300"   },
  sky:     { border: "border-sky-400/30",     bg: "bg-sky-400/10",     text: "text-sky-300"     },
  default: { border: "border-white/15",       bg: "bg-white/8",        text: "text-slate-300"   },
};
