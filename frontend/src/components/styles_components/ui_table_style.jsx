export const UI_TABLE = {
  // ===== CONTENEDOR GENERAL =====
  wrapper:
    "relative overflow-hidden rounded-3xl border border-white/10 bg-[var(--rav-table-bg)] shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(34,211,238,0.03)] backdrop-blur-md",

  glow: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,rgba(255,110,35,0.08),transparent_55%),radial-gradient(ellipse_50%_45%_at_100%_100%,rgba(34,211,238,0.06),transparent_55%)]",

  inner: "relative z-10",

  // ===== CABECERA =====
  header: "border-b border-white/[0.07] px-5 py-4 sm:px-6",

  title: "text-base font-semibold tracking-tight text-white sm:text-lg",

  description: "mt-1 text-sm leading-6 text-white/55",

  helperWrap:
    "mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3",

  helperText: "text-sm leading-6 text-cyan-200/75",

  helperStrong: "font-semibold text-cyan-300",

  // ===== SCROLL / TABLA =====
  scroll: "overflow-x-auto",

  table: "min-w-full border-separate border-spacing-0",

  // ===== HEAD =====
  theadRow: "bg-white/[0.025]",

  th: "border-b border-white/[0.35] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200",

  thCompact:
    "border-b border-white/[0.07] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500",

  // ===== BODY =====
  tbody: "",

  tr: "transition duration-150 hover:bg-white/[0.035]",

  trStriped: "odd:bg-white/[0.012] even:bg-transparent",

  trSelected: "bg-cyan-400/10",

  td: "border-b border-white/[0.04] px-5 py-3.5 text-sm text-slate-200 align-middle",

  tdCompact:
    "border-b border-white/[0.04] px-4 py-2.5 text-sm text-slate-200 align-middle",

  tdMuted: "text-slate-400",

  tdStrong: "font-semibold text-white",

  tdNumeric: "font-mono font-medium tabular-nums text-slate-200",

  // ===== ACCIONES =====
  actionsWrapLeft: "flex items-center justify-start gap-1.5",

  actionsWrapRight: "flex items-center justify-end gap-1.5",

  actionButton:
    "rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonPrimary:
    "rounded-lg border border-orange-400/50 bg-orange-400/15 px-2.5 py-1.5 text-xs font-medium text-orange-200 transition hover:bg-orange-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonCyan:
    "rounded-lg border border-cyan-400/50 bg-cyan-400/15 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonDanger:
    "rounded-lg border border-rose-400/50 bg-rose-400/15 px-2.5 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonGreen:
    "rounded-lg border border-green-400/50 bg-green-400/15 px-2.5 py-1.5 text-xs font-medium text-green-200 transition hover:bg-green-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonPurple:
    "rounded-lg border border-purple-400/50 bg-purple-400/15 px-2.5 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonBlue:
    "rounded-lg border border-blue-400/50 bg-blue-400/15 px-2.5 py-1.5 text-xs font-medium text-blue-200 transition hover:bg-blue-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonIndigo:
    "rounded-lg border border-indigo-400/50 bg-indigo-400/15 px-2.5 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonSky:
    "rounded-lg border border-sky-400/50 bg-sky-400/15 px-2.5 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonTeal:
    "rounded-lg border border-teal-400/50 bg-teal-400/15 px-2.5 py-1.5 text-xs font-medium text-teal-200 transition hover:bg-teal-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonAmber:
    "rounded-lg border border-amber-400/50 bg-amber-400/15 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonYellow:
    "rounded-lg border border-yellow-400/50 bg-yellow-400/15 px-2.5 py-1.5 text-xs font-medium text-yellow-200 transition hover:bg-yellow-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonLime:
    "rounded-lg border border-lime-400/50 bg-lime-400/15 px-2.5 py-1.5 text-xs font-medium text-lime-200 transition hover:bg-lime-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonPink:
    "rounded-lg border border-pink-400/50 bg-pink-400/15 px-2.5 py-1.5 text-xs font-medium text-pink-200 transition hover:bg-pink-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonFuchsia:
    "rounded-lg border border-fuchsia-400/50 bg-fuchsia-400/15 px-2.5 py-1.5 text-xs font-medium text-fuchsia-200 transition hover:bg-fuchsia-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  actionButtonSlate:
    "rounded-lg border border-slate-400/35 bg-slate-400/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-400/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",

  // ===== ESTADOS =====
  emptyWrap: "flex min-h-[160px] items-center justify-center px-6 py-12",

  emptyBox:
    "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-6 text-center",

  emptyIcon: "text-slate-600",

  emptyText: "text-sm text-slate-400",

  loadingWrap: "flex min-h-[160px] items-center justify-center px-6 py-12",

  loadingBox:
    "flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4 text-sm text-slate-400",

  // ===== BADGES =====
  badge:
    "inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300",

  badgeOrange:
    "inline-flex items-center rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300",

  badgeGreen:
    "inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-green-300",

  badgePurple:
    "inline-flex items-center rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-purple-300",

  badgeSuccess:
    "inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300",

  badgeDanger:
    "inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300",

  // ===== PAGINACIÓN =====
  paginationWrap: "border-t border-white/[0.06] px-5 py-4 sm:px-6",

  paginationInfo: "font-mono text-[11px] text-slate-500",

  paginationLabel:
    "font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500",

  paginationSelect:
    "rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs text-slate-300 outline-none transition hover:border-cyan-400/30 focus:border-cyan-400/40",

  paginationButtonsWrap: "flex flex-wrap items-center gap-1.5",

  paginationButton:
    "rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/8 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30",

  paginationCurrent:
    "rounded-lg border border-cyan-400/20 bg-cyan-400/8 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-300",
};
