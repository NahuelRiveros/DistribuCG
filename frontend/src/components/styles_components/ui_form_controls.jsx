export const UI_FORM_CONTROLS = {
  card: "w-full rounded-[28px] border border-cyan-400/20 bg-[var(--rav-card-bg)] p-6 shadow-[0_4px_32px_rgba(0,0,0,0.45),0_0_60px_rgba(34,211,238,0.06)] backdrop-blur-xl sm:p-8",

  cardGlow:
    "absolute inset-0 rounded-[28px] bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(34,211,238,0.08),transparent)]",

  cardContent: "relative",

  title: "text-2xl font-black tracking-tight text-white sm:text-3xl",

  subtitle: "mt-2 text-sm leading-6 text-slate-300",

  body: "mt-6",

  fieldWrap: "group",

  label: "block text-sm font-semibold text-white",

  inputBase:
    "mt-1 w-full rounded-2xl border px-3.5 py-3 outline-none transition duration-200 placeholder:text-slate-400",

  inputEnabled:
    "border-cyan-400/40 bg-white/10 text-white hover:border-cyan-300/40 hover:bg-white/15 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/40",

  inputReadOnly: "border-white/10 bg-white/10 text-slate-100 cursor-default",

  inputDisabledVisual:
  "border-white/10 bg-white/[0.04] text-slate-400",
  inputError:
    "border-rose-400/50 bg-rose-500/10 text-white focus:border-rose-300/60 focus:ring-2 focus:ring-rose-400/40",

  errorText: "mt-1 text-sm text-rose-300",

  selectBase:
    "mt-1 w-full rounded-2xl border px-3.5 py-3 outline-none transition duration-200",

  selectEnabled:
    "border-cyan-400/40 bg-white/10 text-white hover:border-cyan-300/40 hover:bg-white/15 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/40",

  selectDisabled:
    "cursor-not-allowed border-white/10 bg-white/5 text-slate-500 focus:ring-0",

  selectError:
    "border-rose-400/50 bg-rose-500/10 text-white focus:border-rose-300/60 focus:ring-2 focus:ring-rose-400/40",

  option: "bg-slate-900 text-white",

  buttonWrap: "flex",

  buttonBase:
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition duration-200 active:scale-[0.99]",

  actionButton:
    "rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonPrimary:
    "rounded-xl border border-orange-400 bg-orange-400/75 px-3 py-1.5 text-xs font-medium text-orange-100 transition hover:border-orange-300/50 hover:bg-orange-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonCyan:
    "rounded-xl border border-cyan-400 bg-cyan-400/75 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonDanger:
    "rounded-xl border border-rose-400 bg-rose-400/75 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonGreen:
    "rounded-xl border border-green-400 bg-green-400/75 px-3 py-1.5 text-xs font-medium text-green-100 transition hover:border-green-300/50 hover:bg-green-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonPurple:
    "rounded-xl border border-purple-400 bg-purple-400/75 px-3 py-1.5 text-xs font-medium text-purple-100 transition hover:border-purple-300/50 hover:bg-purple-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonBlue:
    "rounded-xl border border-blue-400 bg-blue-400/75 px-3 py-1.5 text-xs font-medium text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonIndigo:
    "rounded-xl border border-indigo-400 bg-indigo-400/75 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:border-indigo-300/50 hover:bg-indigo-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonSky:
    "rounded-xl border border-sky-400 bg-sky-400/75 px-3 py-1.5 text-xs font-medium text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonTeal:
    "rounded-xl border border-teal-400 bg-teal-400/75 px-3 py-1.5 text-xs font-medium text-teal-100 transition hover:border-teal-300/50 hover:bg-teal-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonAmber:
    "rounded-xl border border-amber-400 bg-amber-400/75 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonYellow:
    "rounded-xl border border-yellow-400 bg-yellow-400/75 px-3 py-1.5 text-xs font-medium text-yellow-100 transition hover:border-yellow-300/50 hover:bg-yellow-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonLime:
    "rounded-xl border border-lime-400 bg-lime-400/75 px-3 py-1.5 text-xs font-medium text-lime-100 transition hover:border-lime-300/50 hover:bg-lime-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonPink:
    "rounded-xl border border-pink-400 bg-pink-400/75 px-3 py-1.5 text-xs font-medium text-pink-100 transition hover:border-pink-300/50 hover:bg-pink-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonFuchsia:
    "rounded-xl border border-fuchsia-400 bg-fuchsia-400/75 px-3 py-1.5 text-xs font-medium text-fuchsia-100 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  actionButtonSlate:
    "rounded-xl border border-slate-400 bg-slate-400/40 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-300/50 hover:bg-slate-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",

  buttonDisabled: "cursor-not-allowed opacity-50 hover:bg-[rgb(255,110,35)]",

  buttonFull: "w-full",

  helperBox:
    "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs leading-5 text-slate-300",

  formMessageBase:
    "rounded-2xl border px-4 py-3 text-sm text-center backdrop-blur",

  formMessageError: "border-rose-400/30 bg-rose-500/10 text-rose-200",

  formMessageWarning: "border-amber-400/30 bg-amber-500/10 text-amber-200",

  formMessageInfo: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",

  formMessageSuccess:
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
};