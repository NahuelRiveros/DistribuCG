export const UI_MODAL_CALC = {
  // ===== OVERLAY =====
  overlay:
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",

  // ===== CONTENEDOR =====
  modal:
    "w-full max-w-5xl xl:max-w-6xl rounded-3xl border border-white/10 bg-[rgb(20,16,34)] shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden",

  // glow interno (opcional)
  glow:
    "absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,119,0,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(0,255,200,0.10),transparent_30%)]",

  // ===== HEADER =====
  header:
    "relative z-10 border-b border-white/10 px-6 py-5 backdrop-blur",

  headerRow:
    "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",

  title: "text-xl font-bold text-white",

  subtitle: "mt-1 text-sm text-white/60",

  closeButton:
    "rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition",

  // ===== BODY =====
  body: "relative z-10 max-h-[70vh]  overflow-y-auto px-4 py-6 md:px-6",

  loadingBox:
    "rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70",

  contentGrid:
    "grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]",

  // ===== SIDEBAR =====
  sidebar:
    "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur",

  statusCard:
    "mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm",

  statusRow: "flex items-center justify-between",

  statusLabel: "text-white/60",

  statusMeta: "mt-3 space-y-1 text-xs text-white/50",

  badgeLoaded:
    "rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-400/15 text-emerald-300",

  badgeEmpty:
    "rounded-full px-2.5 py-1 text-xs font-semibold bg-white/10 text-white/60",

  // ===== PANEL DERECHO =====
  rightCol: "space-y-4",

  section:
    "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur",

  sectionWhite:
    "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur",

  sectionTitle: "text-base font-semibold text-white",

  // ===== FORM =====
  label: "block text-sm font-medium text-white/70",

  input:
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20",

  inputReadonly:
    "mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white/80",

  textarea:
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20",

  radioWrap: "mt-2 flex flex-wrap gap-4",

  radioLabel: "inline-flex items-center gap-2 text-sm text-white/70",

  errorText: "mt-1 text-sm text-red-400",

  helperBox:
    "rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70",

  // ===== TRAMOS =====
  tramoCard:
    "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur",

  tramoHeader: "mb-3 flex items-center justify-between",

  tramoTitle: "text-sm font-semibold text-white",

  tramoGrid:
    "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",

  // ===== RESULTADOS =====
  resultGrid2:
    "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2",

  resultGrid3:
    "mt-4 grid grid-cols-1 gap-4 md:grid-cols-3",

  resultGrid4:
    "mt-4 grid grid-cols-1 gap-4 md:grid-cols-4",

  resultBadgeOk:
    "rounded-full px-3 py-1 text-xs font-semibold bg-emerald-400/15 text-emerald-300",

  resultBadgeWarn:
    "rounded-full px-3 py-1 text-xs font-semibold bg-amber-400/15 text-amber-300",

  // ===== FOOTER =====
  footer:
    " border-t border-white/10 px-6 py-4 flex flex-row sm:flex-row justify-end gap-3 backdrop-blur bg-black/20",

  actionNeutral:
    "w-full sm:w-auto flex justify-center items-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 sm:py-2 font-semibold text-white/80 hover:bg-white/10 transition active:scale-95",

  actionDanger:
    "w-full sm:w-auto flex justify-center items-center rounded-xl border border-red-400/30 bg-red-400/10 px-6 py-3 sm:py-2 font-semibold text-red-300 hover:bg-red-400/20 transition active:scale-95",

  actionPrimary:
    "w-full sm:w-auto flex justify-center items-center rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 sm:py-2 font-semibold text-white shadow-lg hover:opacity-90 transition active:scale-95",
};