export const UI_CARD = {
  base: "group relative overflow-hidden rounded-3xl border bg-white/5 backdrop-blur-xl transition-all duration-300",

  glow: "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_50%)]",

  featureBase:
    "flex h-full flex-col border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.28)] hover:-translate-y-1",

  featureImageWrap:
    "relative h-44 overflow-hidden border-b border-white/10 bg-slate-900/70",

  featureImage:
    "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]",

  featureBody: "relative z-10 flex flex-1 flex-col p-5 md:p-6",

  featureSubtitle: "text-md font-bold uppercase tracking-[0.18em]",

  featureTitle: "mt-2 text-xl font-semibold leading-tight text-white",

  featureText: "mt-3 text-md leading-7 text-slate-300",

  featureFooter: "mt-5 pt-2",

  featureLink:
    "inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] uppercase text-cyan-200 transition hover:bg-cyan-400/15",

  CardsWrap: "mt-12 w-full",

  CardsGrid: "grid gap-6 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr",
  tone: {
    cyan: {
      border: "border-cyan-400/40",
      label: "text-cyan-200",
      glow: "shadow-[0_0_26px_rgba(34,211,238,0.08)]",
    },
    orange: {
      border: "border-orange-400/40",
      label: "text-orange-300",
      glow: "shadow-[0_0_26px_rgba(249,115,22,0.10)]",
    },
    purple: {
      border: "border-fuchsia-400/40",
      label: "text-fuchsia-200",
      glow: "shadow-[0_0_26px_rgba(217,70,239,0.08)]",
    },
    green: {
      border: "border-emerald-400/40",
      label: "text-emerald-200",
      glow: "shadow-[0_0_26px_rgba(52,211,153,0.08)]",
    },
  },
};