export const UI_DASHBOARD = {
  // ==========================================================
  // PÁGINA
  // ==========================================================
  pageWrap: "w-full space-y-5",
  sectionGap: "space-y-5",

  // ==========================================================
  // COMMAND HEADER
  // ==========================================================
  commandHeader:
    "relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(4,6,18,0.99)_0%,rgba(8,12,28,0.97)_60%,rgba(15,23,42,0.95)_100%)] px-8 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_40px_100px_rgba(0,0,0,0.70)] backdrop-blur-2xl",

  commandHeaderGlow:
    "absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_90%_70%_at_-5%_-10%,rgba(249,115,22,0.22),transparent),radial-gradient(ellipse_70%_60%_at_105%_110%,rgba(34,211,238,0.13),transparent)]",

  commandHeaderContent:
    "relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",

  commandClassification:
    "mb-3 flex items-center gap-2.5 text-[9px] font-black tracking-[0.35em] uppercase text-orange-400/65",

  commandTitle:
    "text-4xl font-black tracking-[-0.02em] text-white md:text-5xl lg:text-[58px] lg:leading-[1.05]",

  commandTitleAccent:
    "bg-[linear-gradient(135deg,#fb923c_0%,#fbbf24_100%)] bg-clip-text text-transparent",

  commandMeta:
    "mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-mono tracking-wide",

  commandRight:
    "flex flex-col items-start gap-2 sm:items-end sm:shrink-0",

  commandUser:
    "text-sm font-semibold text-slate-300 tracking-tight",

  commandDate:
    "text-[11px] font-mono text-slate-500 tabular-nums",

  // ==========================================================
  // FILTER PANEL
  // ==========================================================
  filterPanel:
    "relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(4,6,16,0.82)] px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.30)] backdrop-blur-xl",

  filterPanelGlow:
    "absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.015),transparent_50%)]",

  filterPanelInner:
    "relative z-10 space-y-4",

  filterPanelHeader:
    "flex items-center gap-2",

  filterPanelTitle:
    "text-[9px] font-black uppercase tracking-[0.32em] text-white/35",

  filterActiveBadge:
    "inline-flex items-center gap-1 rounded-full border border-orange-400/25 bg-orange-400/8 px-2 py-0.5 text-[9px] font-black tracking-widest text-orange-400",

  filtersGrid:
    "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5",

  filtersActions:
    "flex flex-col gap-2 sm:flex-row sm:justify-end",

  checkboxWrap:
    "flex h-[50px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 text-sm text-slate-200",

  checkboxInput: "h-4 w-4 rounded border-white/20 bg-slate-950/60",

  // ==========================================================
  // KPI
  // ==========================================================
  kpiGrid:
    "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",

  kpiCard:
    "group relative overflow-hidden rounded-[26px] border bg-[linear-gradient(160deg,rgba(10,15,32,0.98)_0%,rgba(6,9,22,0.93)_100%)] pt-7 px-6 pb-6 shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur transition-all duration-300 hover:shadow-[0_30px_80px_rgba(0,0,0,0.60)] hover:-translate-y-0.5 cursor-default",

  kpiGlow:
    "absolute inset-0 opacity-100 pointer-events-none transition-opacity duration-300",

  kpiContent: "relative z-10 flex min-h-[148px] flex-col justify-between gap-4",

  kpiLabel: "text-[10px] font-bold uppercase tracking-[0.22em] text-white/40",

  kpiValue: "text-5xl font-black leading-none tabular-nums text-white md:text-[56px]",

  kpiHelp: "text-[11px] text-white/35 font-mono",

  kpiTone: {
    cyan: {
      border: "border-cyan-400/[0.16]",
      chip: "bg-cyan-400/10 text-cyan-300",
      value: "text-cyan-200",
      glow:
        "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.08),transparent_40%)]",
      lineGrad: "linear-gradient(90deg,rgba(34,211,238,0.90)_0%,rgba(14,165,233,0.45)_100%)",
      iconBg: "rgba(34,211,238,0.10)",
    },
    orange: {
      border: "border-orange-400/[0.16]",
      chip: "bg-orange-400/10 text-orange-300",
      value: "text-orange-200",
      glow:
        "bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.20),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_40%)]",
      lineGrad: "linear-gradient(90deg,rgba(249,115,22,0.90)_0%,rgba(251,146,60,0.45)_100%)",
      iconBg: "rgba(249,115,22,0.10)",
    },
    green: {
      border: "border-emerald-400/[0.16]",
      chip: "bg-emerald-400/10 text-emerald-300",
      value: "text-emerald-200",
      glow:
        "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.08),transparent_40%)]",
      lineGrad: "linear-gradient(90deg,rgba(16,185,129,0.90)_0%,rgba(52,211,153,0.45)_100%)",
      iconBg: "rgba(16,185,129,0.10)",
    },
    purple: {
      border: "border-fuchsia-400/[0.16]",
      chip: "bg-fuchsia-400/10 text-fuchsia-300",
      value: "text-fuchsia-200",
      glow:
        "bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_40%)]",
      lineGrad: "linear-gradient(90deg,rgba(217,70,239,0.90)_0%,rgba(168,85,247,0.45)_100%)",
      iconBg: "rgba(217,70,239,0.10)",
    },
    slate: {
      border: "border-white/[0.09]",
      chip: "bg-white/8 text-white/60",
      value: "text-white",
      glow:
        "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.05),transparent_40%)]",
      lineGrad: "linear-gradient(90deg,rgba(148,163,184,0.70)_0%,rgba(100,116,139,0.35)_100%)",
      iconBg: "rgba(148,163,184,0.08)",
    },
  },

  kpiChip:
    "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",

  // ==========================================================
  // GRID STATS
  // ==========================================================
  statsGrid2: "grid grid-cols-1 gap-5 xl:grid-cols-2",
  statsGrid3: "grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3",
  fullWidthBlock: "col-span-1 xl:col-span-2",

  // ==========================================================
  // TARJETA INTERNA — BAR LIST
  // ==========================================================
  block:
    "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(8,12,26,0.98)_0%,rgba(5,8,18,0.94)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.40),0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur",

  blockGlow:
    "absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.025),transparent_35%)]",

  blockContent: "relative z-10 space-y-5",

  blockHeader:
    "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between",

  blockTitle: "text-sm font-bold text-white tracking-tight",

  blockSubtitle: "text-xs text-white/40 mt-0.5",

  blockBadge:
    "inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/40",

  // ==========================================================
  // BAR LIST
  // ==========================================================
  listWrap: "space-y-3",

  listItem: "space-y-1.5",

  listRow: "flex items-center justify-between gap-3",

  listRank:
    "shrink-0 w-5 text-[10px] font-black tabular-nums text-white/20 text-right",

  listLabel: "truncate text-sm text-slate-300 font-medium",

  listValue: "shrink-0 text-sm font-black text-white tabular-nums",

  progressTrack: "h-1.5 overflow-hidden rounded-full bg-white/[0.06]",

  progressBarBase: "h-full rounded-full transition-all duration-500",

  progressTone: {
    cyan: "bg-gradient-to-r from-cyan-400/80 to-sky-400/60",
    orange: "bg-gradient-to-r from-orange-400/80 to-amber-400/60",
    green: "bg-gradient-to-r from-emerald-400/80 to-lime-400/60",
    purple: "bg-gradient-to-r from-fuchsia-400/80 to-violet-400/60",
    slate: "bg-gradient-to-r from-slate-300/60 to-slate-500/40",
  },

  // tone accent for chart/block cards
  chartToneAccent: {
    cyan:   "linear-gradient(90deg,rgba(34,211,238,0.70)_0%,rgba(14,165,233,0.25)_100%)",
    orange: "linear-gradient(90deg,rgba(249,115,22,0.70)_0%,rgba(251,146,60,0.25)_100%)",
    green:  "linear-gradient(90deg,rgba(16,185,129,0.70)_0%,rgba(52,211,153,0.25)_100%)",
    purple: "linear-gradient(90deg,rgba(217,70,239,0.70)_0%,rgba(168,85,247,0.25)_100%)",
    slate:  "linear-gradient(90deg,rgba(148,163,184,0.50)_0%,rgba(100,116,139,0.20)_100%)",
  },

  // ==========================================================
  // TABLAS
  // ==========================================================
  simpleTableWrap:
    "overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20",

  simpleTableHeader:
    "grid grid-cols-[1.4fr_1fr_1fr_100px] gap-3 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/40",

  simpleTableRow:
    "grid grid-cols-[1.4fr_1fr_1fr_100px] gap-3 border-b border-white/[0.04] px-5 py-3 text-sm text-slate-300 last:border-b-0 hover:bg-white/[0.02] transition-colors",

  simpleTableCellValue: "text-right font-bold text-white tabular-nums",

  // ==========================================================
  // GRÁFICOS
  // ==========================================================
  chartCard:
    "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(8,12,26,0.98)_0%,rgba(5,8,18,0.94)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.40),0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur",

  chartGlow:
    "absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.025),transparent_35%)]",

  chartContent: "relative z-10 space-y-5",

  chartHeader:
    "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between",

  chartTitle: "text-sm font-bold text-white tracking-tight",

  chartSubtitle: "text-xs text-white/40 mt-0.5",

  chartBadge:
    "inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/40",

  chartWrap:
    "h-[300px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black/20 p-3 md:h-[320px]",

  chartInner: "h-full w-full",

  chartEmpty:
    "flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/[0.07] bg-black/15 text-sm text-slate-500 md:h-[320px]",

  chartTooltip:
    "rounded-xl border border-white/[0.10] bg-[rgb(8,12,28)] px-3 py-2 text-xs text-white shadow-xl",

  chartTooltipLabel: "mb-1 text-[10px] font-black uppercase tracking-wide text-white/40",

  chartTooltipValue: "text-sm font-black text-white tabular-nums",

  chartLegend: "text-xs text-white/50",
  chartAxis: "text-xs text-white/35",
  chartGrid: "stroke-white/[0.07]",

  chartPalette: {
    cyan: "#22d3ee",
    orange: "#fb923c",
    green: "#34d399",
    purple: "#c084fc",
    pink: "#f472b6",
    slate: "#94a3b8",
  },

  // ==========================================================
  // NAV TAB BAR
  // ==========================================================
  navBar:
    "flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[rgba(4,6,16,0.85)] p-1.5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35)]",

  navTab:
    "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[10px] font-black tracking-[0.06em] transition-all duration-200 whitespace-nowrap uppercase",

  navTabIdle:
    "text-white/30 hover:bg-white/[0.05] hover:text-white/55",

  navTabActiveCyan:
    "bg-cyan-400/[0.12] text-cyan-300 ring-1 ring-inset ring-cyan-400/[0.22] shadow-[0_0_16px_rgba(34,211,238,0.12),0_2px_8px_rgba(0,0,0,0.25)]",

  navTabActiveOrange:
    "bg-orange-400/[0.12] text-orange-300 ring-1 ring-inset ring-orange-400/[0.22] shadow-[0_0_16px_rgba(251,146,60,0.12),0_2px_8px_rgba(0,0,0,0.25)]",

  navTabActiveGreen:
    "bg-emerald-400/[0.12] text-emerald-300 ring-1 ring-inset ring-emerald-400/[0.22] shadow-[0_0_16px_rgba(52,211,153,0.12),0_2px_8px_rgba(0,0,0,0.25)]",

  navTabActivePurple:
    "bg-fuchsia-400/[0.12] text-fuchsia-300 ring-1 ring-inset ring-fuchsia-400/[0.22] shadow-[0_0_16px_rgba(192,132,252,0.12),0_2px_8px_rgba(0,0,0,0.25)]",

  navTabActiveSlate:
    "bg-white/[0.06] text-white/65 ring-1 ring-inset ring-white/[0.12] shadow-[0_2px_10px_rgba(255,255,255,0.04)]",

  // ==========================================================
  // VACÍO
  // ==========================================================
  emptyBox:
    "rounded-2xl border border-dashed border-white/[0.07] bg-black/15 px-4 py-8 text-center text-sm text-slate-500",

  // ==========================================================
  // LOADING SKELETON
  // ==========================================================
  loadingBox:
    "rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-8 text-center text-sm text-white/50",

  skeletonGrid3:
    "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",

  skeletonKpi:
    "h-[148px] rounded-[26px] animate-pulse bg-white/[0.04]",

  skeletonChartTall:
    "h-[300px] rounded-[24px] animate-pulse bg-white/[0.03]",

  skeletonGrid2:
    "grid grid-cols-1 gap-5 xl:grid-cols-2",

  skeletonHalf:
    "h-[300px] rounded-[24px] animate-pulse bg-white/[0.03]",

  // ==========================================================
  // BADGES
  // ==========================================================
  badge: {
    neutral:
      "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/65",
    success:
      "inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300",
    warning:
      "inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300",
    danger:
      "inline-flex items-center rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-300",
    info:
      "inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300",
    purple:
      "inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-300",
  },

  helperText: "text-xs text-white/40",
  emphasisText: "font-semibold text-white",
  mutedText: "text-sm text-white/45",

  // legacy — kept for backward compat
  filtersWrap: "space-y-5",
  sectionMenuWrap: "flex flex-wrap gap-3",
  sectionMenuButtonBase:
    "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition active:scale-95",
  sectionMenuButtonIdle:
    "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
  sectionMenuButtonActive:
    "border-cyan-400/30 bg-cyan-400/50 text-cyan-200",
  sectionMenuButtonOrange:
    "border-orange-400/30 bg-orange-400/50 text-orange-200",
  sectionMenuButtonGreen:
    "border-emerald-400/30 bg-emerald-400/50 text-emerald-200",
  sectionMenuButtonPurple:
    "border-fuchsia-400/30 bg-fuchsia-400/50 text-fuchsia-200",
};
