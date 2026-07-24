export const UI_LAYOUT = {
  // footer base
  footer:
    "relative overflow-hidden border-t border-white/10 bg-slate-950 text-white",

  footerGlow:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(34,211,238,0.10),transparent_100%),radial-gradient(circle_at_85%_0%,rgba(255,110,35,0.10),transparent_22%)]",

  footerGrid:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px]",

  footerTopLine:
    "relative z-10 h-[2px] bg-gradient-to-r from-cyan-500 via-cyan-300 to-[rgb(255,110,35)]",

  container: "relative z-10 mx-auto w-full max-w-7xl px-6",

  footerMain: "grid grid-cols-1 gap-10 py-12 md:grid-cols-2 xl:grid-cols-4",

  footerBottom:
    "relative z-10 border-t border-white/10 py-6 text-center text-sm text-slate-500",

  footerBottomSubtext: "mt-1 text-slate-600",

  // marca
  brandWrap: "space-y-4",

  brandTitle: "text-2xl font-extrabold tracking-tight text-cyan-300",

  brandText: "max-w-sm text-sm leading-7 text-slate-400",

  brandMeta: "text-sm text-slate-500",

  // títulos de bloque
  sectionTitle: "mb-4 text-lg font-semibold text-white",

  sectionText: "text-sm leading-7 text-slate-400",

  // lista de items
  itemList: "space-y-3",

  itemRow: "flex items-start gap-3",

  itemIconWrap:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.08)]",

  itemTitle: "text-sm font-semibold text-white",

  itemText: "mt-0.5 text-sm leading-6 text-slate-400",

  // bloque destacado
  noteBox:
    "mt-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-4 backdrop-blur",

  noteTitle: "font-semibold text-cyan-300",

  noteText: "mt-1 text-sm leading-6 text-slate-300",

  // quick links
  quickLinkList: "space-y-2",
  quickLinkItem:
    "flex items-center gap-2.5 text-sm text-slate-400 transition-colors hover:text-cyan-300",
  quickLinkIcon:
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-500",

  // links
  link: "transition-colors hover:text-cyan-300",

  // utilidad compartida para navbar/footer
  panel: "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl",

  softBorder: "border-white/10",

  accentCyan: "text-cyan-300",

  accentOrange: "text-[rgb(255,110,35)]",
};
