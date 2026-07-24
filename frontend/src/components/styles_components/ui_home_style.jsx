export const UI_HOME = {
  // ═══════════════════════════════════════════
  // BASE
  // ═══════════════════════════════════════════
  screen: "relative min-h-screen overflow-hidden bg-(--rav-bg) text-white",

  glow: [
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_at_15%_15%,rgba(34,211,238,0.13),transparent_40%),",
    "radial-gradient(ellipse_at_85%_5%,rgba(249,115,22,0.13),transparent_38%),",
    "radial-gradient(ellipse_at_50%_80%,rgba(249,115,22,0.05),transparent_50%)]",
  ].join(""),

  gridOverlay: [
    "pointer-events-none absolute inset-0",
    "bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),",
    "linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)]",
    "bg-[size:44px_44px]",
  ].join(""),

  container: "relative z-10 mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20",

  // ═══════════════════════════════════════════
  // HERO
  // ═══════════════════════════════════════════
  heroWrap: "mx-auto flex max-w-6xl flex-col items-center text-center",

  // Badge con hueco para el punto pulsante (se agrega en HomeHero)
  badge: [
    "inline-flex items-center gap-2.5 rounded-full",
    "border border-cyan-400/30 bg-cyan-400/[0.08]",
    "px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200",
    "shadow-[0_0_24px_rgba(34,211,238,0.10)]",
  ].join(" "),

  badgePulseWrap: "relative flex h-2 w-2",
  badgePulseOuter: "absolute -inset-0.5 animate-ping rounded-full bg-emerald-400/40",
  badgePulseInner: "relative h-2 w-2 rounded-full bg-emerald-400",

  heroTitleLarge: [
    "mt-6 max-w-4xl text-[2.6rem] font-black leading-none tracking-tight text-white",
    "md:text-7xl lg:text-8xl",
  ].join(" "),

  heroAccentOrange: [
    "block text-[rgb(255,110,35)]",
    "drop-shadow-[0_0_32px_rgba(249,115,22,0.35)]",
  ].join(" "),

  heroDescription:
    "mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base",

  // ── Stats strip ──────────────────────────────
  statsStrip: "mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2",

  statItem: [
    "flex items-center gap-1.5",
    "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500",
  ].join(" "),

  statDot: "h-1.5 w-1.5 shrink-0 rounded-full",

  statSep: "hidden text-white/[0.12] sm:block",

  // ── Carousel wrapper ─────────────────────────
  carouselWrap: "mt-10 w-full",

  // ── Section separator antes de las cards ─────
  cardsSectionWrap: "mt-16 w-full",

  cardsSectionLabel: "mb-8 flex items-center gap-4",
  cardsSectionLine: "h-px flex-1 bg-white/[0.07]",
  cardsSectionText: [
    "text-[9px] font-black uppercase tracking-[0.28em] text-white/[0.22]",
    "whitespace-nowrap",
  ].join(" "),

  // ═══════════════════════════════════════════
  // CAROUSEL
  // ═══════════════════════════════════════════
  carouselShell: [
    "relative overflow-hidden rounded-[28px]",
    "border border-white/[0.08] bg-white/[0.035]",
    "p-4 md:p-6",
    "shadow-[0_28px_80px_rgba(0,0,0,0.50),inset_0_1px_0_rgba(255,255,255,0.04)]",
    "backdrop-blur-xl",
  ].join(" "),

  carouselViewport: "relative overflow-hidden",

  carouselTrack: "flex w-full transition-transform duration-700 ease-out",

  carouselSlide: "w-full shrink-0 px-1",

  carouselGrid: "grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]",

  slideContent: "space-y-5 text-left",

  titleBadge: [
    "inline-flex items-center rounded-full",
    "border border-orange-400/30 bg-orange-400/[0.10]",
    "px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em] text-orange-200",
    "shadow-[0_0_20px_rgba(249,115,22,0.15)]",
  ].join(" "),

  slideTitle: "text-2xl font-black leading-tight tracking-tight text-white md:text-3xl",

  subtitle: "text-sm font-semibold text-slate-200 md:text-base",

  descriptionSmall: "text-sm leading-7 text-slate-400 md:text-base",

  ctaRow: "flex flex-wrap gap-3 pt-1",

  // ── Highlights ───────────────────────────────
  highlightsGrid: "grid gap-3 pt-2 sm:grid-cols-2",

  highlightCardBase: [
    "rounded-2xl border bg-slate-950/50 p-4 backdrop-blur",
    "transition-all duration-200 hover:-translate-y-0.5",
    "hover:shadow-lg",
  ].join(" "),

  highlightCardOrange:
    "border-orange-400/30 hover:border-orange-400/50 hover:shadow-orange-400/10",
  highlightCardCyan:
    "border-cyan-400/30 hover:border-cyan-400/50 hover:shadow-cyan-400/10",
  highlightCardPurple:
    "border-fuchsia-400/30 hover:border-fuchsia-400/50 hover:shadow-fuchsia-400/10",
  highlightCardGreen:
    "border-emerald-400/30 hover:border-emerald-400/50 hover:shadow-emerald-400/10",

  highlightTitleBase: "text-sm font-black uppercase tracking-[0.12em]",
  highlightTitleOrange: "text-orange-300",
  highlightTitleCyan:   "text-cyan-300",
  highlightTitlePurple: "text-fuchsia-300",
  highlightTitleGreen:  "text-emerald-300",

  highlightText: "mt-1.5 text-xs leading-5 text-slate-400",

  // ── Visual panel (right column) ──────────────
  visualWrap: "relative",

  visualPanel: [
    "relative overflow-hidden rounded-[22px]",
    "border border-white/[0.08] bg-slate-950/60 p-4",
    "backdrop-blur-xl",
  ].join(" "),

  visualGlow: [
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_48%),",
    "radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_44%)]",
  ].join(""),

  visualGrid: "relative grid gap-3 sm:grid-cols-2",

  // Base de visual card — tono se aplica encima
  visualCardBase: [
    "relative overflow-hidden rounded-xl border bg-slate-950/70 p-4 text-center backdrop-blur",
    "transition-all duration-200 hover:-translate-y-0.5",
  ].join(" "),

  // Franjas de acento (se renderizan via componente)
  visualCardStripeOrange:  "bg-orange-400",
  visualCardStripeCyan:    "bg-cyan-400",
  visualCardStripePurple:  "bg-fuchsia-400",
  visualCardStripeGreen:   "bg-emerald-400",

  visualCardOrange:  "border-orange-400/30  hover:border-orange-400/50",
  visualCardCyan:    "border-cyan-400/30    hover:border-cyan-400/50",
  visualCardPurple:  "border-fuchsia-400/30 hover:border-fuchsia-400/50",
  visualCardGreen:   "border-emerald-400/30 hover:border-emerald-400/50",

  visualCardLabelBase: "text-[10px] font-black uppercase tracking-[0.20em]",
  visualCardLabelOrange: "text-orange-400",
  visualCardLabelCyan:   "text-cyan-400",
  visualCardLabelPurple: "text-fuchsia-400",
  visualCardLabelGreen:  "text-emerald-400",

  visualValue: "mt-2 text-3xl font-black text-white tracking-tight",
  visualText:  "mt-1.5 text-xs leading-5 text-slate-400",

  // ── Barra de progreso autoplay ────────────────
  progressTrack: [
    "absolute bottom-0 left-0 right-0 h-[2px]",
    "overflow-hidden bg-white/[0.07]",
  ].join(" "),

  // ── Controles ────────────────────────────────
  controlsWrap: [
    "mt-5 flex flex-col gap-4",
    "border-t border-white/[0.07] pt-4",
    "sm:flex-row sm:items-center sm:justify-between",
  ].join(" "),

  controlsLeft: "flex items-center gap-2",

  arrowButton: [
    "inline-flex h-9 w-9 items-center justify-center rounded-xl",
    "border border-white/[0.10] bg-white/[0.05] text-white/60",
    "transition-all duration-150",
    "hover:border-orange-400/40 hover:bg-orange-400/[0.08] hover:text-orange-300",
    "active:scale-95",
  ].join(" "),

  counter: [
    "min-w-[60px] text-center",
    "text-[10px] font-black uppercase tracking-[0.22em] text-slate-500",
  ].join(" "),

  dotsWrap: "flex items-center gap-2",

  dot: [
    "h-1.5 w-6 rounded-full bg-white/[0.12]",
    "transition-all duration-300 hover:bg-white/25 cursor-pointer",
  ].join(" "),

  dotActive: "bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.45)] w-8",
};
