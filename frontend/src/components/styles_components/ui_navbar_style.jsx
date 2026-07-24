// ─────────────────────────────────────────────────────────────────────────────
// PALETA DE ACENTO — cambiá solo aquí para re-colorear toda la navbar
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Links / botones ACTIVOS (página actual, item seleccionado)
  activo_bg:       "bg-sky-600",
  activo_texto:    "text-white",
  activo_sombra:   "shadow-sky-500/25",

  // HOVER sobre links inactivos (nav desktop, items dropdown, mobile)
  hover_bg:        "hover:bg-sky-50",
  hover_texto:     "hover:text-sky-700",

  // Estado "abierto" suave (dropdown trigger, accordion mobile abierto)
  suave_bg:        "bg-sky-50",
  suave_texto:     "text-sky-700",
  suave_bg_t:      "bg-sky-50/60",

  // Hover oscuro para botones sólidos (btn login, mobile_btn_login)
  btn_hover:       "hover:bg-sky-700",

  // Iconos en estado activo / abierto
  icono_bg:        "bg-sky-100",
  icono_texto:     "text-sky-600",
  icono_texto_sm:  "text-sky-400",

  // Bordes y sombras de acento
  borde_acento:    "border-sky-100",
  borde_acento_t:  "border-sky-100/60",
  sombra_acento:   "shadow-sky-500/8",

  // Textos de acento
  texto_acento:    "text-sky-500",

  // Gradiente cabecera de paneles dropdown
  grad_header:     "from-slate-50 to-sky-50/50",

  // Focus ring
  foco_ring:       "focus-visible:ring-sky-400",
};
// ─────────────────────────────────────────────────────────────────────────────

export const UI_NAVBAR = {

  // ════════════════════════════════════════════════════════════════
  // BARRA PRINCIPAL — el mismo <header> sirve para desktop Y mobile
  // ════════════════════════════════════════════════════════════════

  barra_header:                                            // ← bg de toda la barra (ambos tamaños)
    "sticky top-0 z-50 border-b border-slate-200/70 bg-slate-100/96 backdrop-blur-xl transition-all duration-300",
  barra_header_con_sombra:
    "shadow-lg shadow-slate-900/8",

  barra_linea_acento:
    "absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sky-400 via-blue-500 to-indigo-400",

  barra_nav_container:
    "mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8",

  barra_backdrop_mobile:
    "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden",

  // ════════════════════════════════════════════════════════════════
  // BRAND / LOGO
  // ════════════════════════════════════════════════════════════════

  brand_link:
    `group flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 ${C.foco_ring} focus-visible:ring-offset-2`,

  brand_badge:
    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-600 text-[10px] font-black text-white shadow-md shadow-sky-500/30 transition-transform duration-200 group-hover:scale-105",

  brand_badge_brillo:
    "absolute inset-0 rounded-xl bg-linear-to-b from-white/20 to-transparent",

  brand_textos:
    "hidden leading-tight sm:block",

  brand_titulo:
    "text-sm font-black tracking-tight text-slate-900",

  brand_subtitulo:
    "text-[11px] font-medium text-slate-400",

  // ════════════════════════════════════════════════════════════════
  // BOTONES DE ACCIÓN — BARRA
  // ════════════════════════════════════════════════════════════════

  btn_login_desktop:
    `inline-flex items-center gap-2 rounded-xl ${C.activo_bg} px-4 py-2 text-sm font-bold ${C.activo_texto} shadow-sm ${C.activo_sombra} transition-all ${C.btn_hover}`,

  btn_hamburguesa:
    "inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100",

  // ════════════════════════════════════════════════════════════════
  // NAVEGACIÓN DESKTOP (navbar_desktop.jsx)
  // ════════════════════════════════════════════════════════════════

  desktop_contenedor:
    "hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex",

  desktop_link:
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200",

  desktop_link_activo:                                     // ← C.activo_bg
    `${C.activo_bg} ${C.activo_texto} shadow-md ${C.activo_sombra}`,

  desktop_link_inactivo:                                   // ← C.hover_bg / C.hover_texto
    `text-slate-600 ${C.hover_bg} ${C.hover_texto}`,

  // ════════════════════════════════════════════════════════════════
  // DROPDOWN DESKTOP (navbar_dropdown.jsx)
  // ════════════════════════════════════════════════════════════════

  dropdown_trigger:
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none",

  dropdown_trigger_abierto:
    `${C.suave_bg} ${C.suave_texto}`,

  dropdown_trigger_cerrado:
    `text-slate-600 ${C.hover_bg} ${C.hover_texto}`,

  dropdown_chevron:
    "shrink-0 transition-transform duration-200",
  dropdown_chevron_abierto:
    "rotate-180",

  dropdown_panel:
    "absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 left-0 w-72",
  dropdown_panel_ancho:
    "absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 right-0 min-w-150",

  dropdown_cabecera:
    `flex items-center gap-2.5 border-b border-slate-100 bg-linear-to-r ${C.grad_header} px-4 py-2.5`,

  dropdown_cabecera_icono:
    `flex h-6 w-6 items-center justify-center rounded-lg ${C.icono_bg} ${C.icono_texto}`,

  dropdown_cabecera_label:
    "text-[11px] font-black uppercase tracking-widest text-slate-500",

  dropdown_columnas:
    "grid grid-cols-3 divide-x divide-slate-100",
  dropdown_columna:
    "p-3",
  dropdown_columna_grupo_cabecera:
    "mb-2 flex items-center gap-1.5 px-1 py-0.5",
  dropdown_columna_grupo_icono:
    `flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${C.suave_bg} ${C.icono_texto_sm}`,

  dropdown_lista:
    "p-2",
  dropdown_grupo_cabecera:
    "mx-1 mb-0.5 mt-2 flex items-center gap-2 px-2 py-1 first:mt-0",
  dropdown_grupo_icono:
    "flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-400",
  dropdown_grupo_divisor:
    "mx-3 mt-1.5 border-b border-slate-100 last:hidden",

  // ════════════════════════════════════════════════════════════════
  // ITEMS (compartidos dropdown desktop + mobile)
  // ════════════════════════════════════════════════════════════════

  item_grupo_label:
    "text-[10px] font-black uppercase tracking-widest text-slate-400",
  item_lista:
    "space-y-0.5",

  item_link:
    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",

  item_link_activo:
    `${C.activo_bg} ${C.activo_texto} shadow-sm ${C.activo_sombra}`,

  item_link_inactivo:
    `text-slate-600 ${C.hover_bg} ${C.hover_texto}`,

  item_icono:
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500",

  item_link_ancho:
    "flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150",
  item_icono_ancho:
    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500",

  // ════════════════════════════════════════════════════════════════
  // MENÚ MOBILE (navbar_mobile.jsx)
  // ════════════════════════════════════════════════════════════════

  mobile_panel:                                            // ← bg panel desplegable mobile
    "overflow-hidden border-t border-slate-100 bg-slate-200/80 transition-all duration-300 ease-in-out lg:hidden",
  mobile_panel_abierto:
    "max-h-[calc(100vh-4rem)] opacity-100",
  mobile_panel_cerrado:
    "max-h-0 opacity-0",

  mobile_scroll:
    "max-h-[calc(100vh-5rem)] overflow-y-auto px-4 pb-6 pt-3",

  mobile_links_lista:
    "mb-3 space-y-0.5",
  mobile_link:
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150",

  mobile_link_activo:
    `${C.activo_bg} ${C.activo_texto} ${C.activo_sombra}`,

  mobile_link_inactivo:
    `bg-white text-slate-600 shadow-slate-100 ${C.hover_bg} ${C.hover_texto}`,

  mobile_link_icono:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500",

  mobile_dropdowns_lista:
    "space-y-1.5",
  mobile_dropdown_tarjeta:
    "overflow-hidden rounded-2xl border transition-all duration-200",

  mobile_dropdown_tarjeta_abierta:
    `${C.borde_acento} bg-white shadow-md ${C.sombra_acento}`,

  mobile_dropdown_tarjeta_cerrada:
    "border-slate-100 bg-white shadow-sm shadow-slate-100",

  mobile_dropdown_trigger:
    "flex w-full items-center justify-between px-3 py-3 text-left transition-colors duration-150",

  mobile_dropdown_trigger_abierto:
    `${C.suave_bg_t}`,

  mobile_dropdown_trigger_cerrado:
    "hover:bg-slate-50",

  mobile_dropdown_icono_abierto:
    `flex h-8 w-8 items-center justify-center rounded-xl ${C.activo_bg} ${C.activo_texto} shadow-sm ${C.activo_sombra} transition-all duration-200`,

  mobile_dropdown_icono_cerrado:
    "flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-200",

  mobile_dropdown_label_abierto:
    `text-sm font-bold ${C.suave_texto} transition-colors duration-150`,

  mobile_dropdown_label_cerrado:
    "text-sm font-bold text-slate-800 transition-colors duration-150",

  mobile_dropdown_chevron_abierto:
    `shrink-0 rotate-180 ${C.texto_acento} transition-all duration-200`,

  mobile_dropdown_chevron_cerrado:
    "shrink-0 text-slate-400 transition-all duration-200",

  mobile_dropdown_contenido:
    `${C.borde_acento_t} border-t px-2 pb-2 pt-1.5`,

  mobile_subgrupo_wrapper:
    "mb-2 last:mb-0",
  mobile_subgrupo_cabecera:
    "flex items-center gap-2 px-2 py-1",
  mobile_subgrupo_icono:
    "flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-400",

  mobile_pie_usuario:
    "mt-4 border-t border-slate-200/60 pt-4",

  mobile_btn_login:
    `flex items-center justify-center gap-2 rounded-2xl ${C.activo_bg} px-4 py-3 text-sm font-black ${C.activo_texto} shadow-md ${C.activo_sombra} transition-opacity ${C.btn_hover}`,

  // ════════════════════════════════════════════════════════════════
  // USER BOX (navbar_userbox.jsx)
  // ════════════════════════════════════════════════════════════════

  userbox_avatar_xl:
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 text-sm font-black text-white shadow-md shadow-sky-500/30 ring-2 ring-white ring-offset-1",
  userbox_avatar_lg:
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 text-sm font-black text-white shadow-md shadow-sky-500/30 ring-2 ring-white ring-offset-1",
  userbox_avatar_sm:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-600 text-xs font-black text-white shadow-sm shadow-sky-500/30",

  userbox_online_sm:
    "relative flex h-1.5 w-1.5 shrink-0",
  userbox_online_sm_ping:
    "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75",
  userbox_online_sm_solido:
    "relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500",
  userbox_online_md:
    "relative flex h-2 w-2 shrink-0",
  userbox_online_md_ping:
    "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60",
  userbox_online_md_solido:
    "relative inline-flex h-2 w-2 rounded-full bg-emerald-500",

  userbox_nombre:
    "truncate text-sm font-black text-slate-900",
  userbox_rol:
    "truncate text-xs font-semibold text-slate-500",

  userbox_mobile_tarjeta:
    "overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm",
  userbox_mobile_header:
    "flex items-center gap-3 p-4",
  userbox_mobile_logout_area:
    "border-t border-slate-100 p-2",
  userbox_mobile_logout_btn:
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50",
  userbox_logout_icono:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600",

  userbox_desktop_trigger:
    "flex items-center gap-2 rounded-2xl px-2 py-1.5 ring-1 transition-all duration-200",
  userbox_desktop_trigger_abierto:
    "bg-slate-50 shadow-sm ring-slate-200",
  userbox_desktop_trigger_cerrado:
    "bg-white ring-slate-200/80 hover:bg-slate-50 hover:shadow-sm",
  userbox_desktop_nombre:
    "max-w-28 truncate text-xs font-black text-slate-900",
  userbox_desktop_rol:
    "max-w-28 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400",
  userbox_desktop_chevron:
    "shrink-0 text-slate-400 transition-transform duration-200",

  userbox_desktop_panel:
    "absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/12 ring-1 ring-black/5",
  userbox_desktop_panel_header:
    "flex items-center gap-3 border-b border-slate-100 p-4",
  userbox_desktop_links_area:
    "p-1.5",
  userbox_desktop_link:
    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",

  userbox_desktop_link_activo:
    `${C.activo_bg} ${C.activo_texto}`,

  userbox_desktop_link_inactivo:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  userbox_desktop_link_icono:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500",
  userbox_desktop_logout_area:
    "border-t border-slate-100 p-1.5",
  userbox_desktop_logout_btn:
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50",

};
