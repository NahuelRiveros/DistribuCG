export const UI_FORM = {
  // ===== CONTENEDOR GENERAL =====
  screen: "relative min-h-screen overflow-hidden bg-[var(--rav-bg)]",

  glow: "absolute inset-0 rav-glow-layer",

  gridOverlay: "absolute inset-0 rav-grid-layer",

  inner:"relative z-10 min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10",

  wrap: "mx-auto w-full px-0",

  grid: "grid items-start gap-6 lg:gap-8 xl:gap-10 lg:grid-cols-[1.02fr_0.98fr]",

  gridNoAside: "grid grid-cols-1",

  // ===== LADO IZQUIERDO =====
  aside: "hidden lg:block",
  asideBox: "max-w-xl pt-4 xl:pt-6",

  badge:
    "inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.07] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/80 backdrop-blur",

  title:
    "mt-7 text-3xl font-black leading-tight text-white sm:text-4xl xl:text-5xl",

  accent: "block text-[rgb(255,140,60)]",

  description:
    "mt-5 max-w-lg text-sm leading-7 text-white/55 sm:text-base sm:leading-8",

  featuresGrid: "mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2",

  featureCardBase: "rounded-xl border p-4 backdrop-blur-sm",

  featureCardCyan: "border-cyan-400/20 bg-cyan-400/[0.06]",
  featureCardGreen: "border-green-400/20 bg-green-400/[0.06]",
  featureCardOrange: "border-orange-400/20 bg-orange-400/[0.06]",
  featureCardPurple: "border-purple-400/20 bg-purple-400/[0.06]",

  featureTitleCyan:
    "font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-300",
  featureTitleOrange:
    "font-mono text-[11px] font-bold uppercase tracking-wider text-orange-300",
  featureTitleGreen:
    "font-mono text-[11px] font-bold uppercase tracking-wider text-green-300",
  featureTitlePurple:
    "font-mono text-[11px] font-bold uppercase tracking-wider text-purple-300",

  featureText: "mt-2 text-sm leading-6 text-white/55",

  // ===== PANEL / CONTENIDO =====
  panel: "w-full min-w-0",

  panelStart: "flex w-full justify-start",
  panelCenter: "flex w-full justify-center",
  panelEnd: "flex w-full justify-end",

  panelSmall: "w-full max-w-md sm:max-w-xl",
  panelMedium: "w-full max-w-4xl",
  panelLarge: "w-full max-w-4xl xl:max-w-6xl",

  mobileBrand: "mb-5 text-center lg:hidden",

  mobileBadge:
    "inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.07] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/80 backdrop-blur",
};
