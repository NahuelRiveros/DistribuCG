// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS DE NEGOCIO — Gym y Kinesiología se venden y habilitan por separado.
//
// El estado real (¿está habilitado "gym"/"kinesiologia" para esta instalación?)
// ya no vive acá — se togglea en vivo desde /super-admin/modulos y se guarda en
// la tabla modulo_negocio (servidor/src/models/sistema/modulo_negocio.js), con
// el mismo gate aplicado también en el backend (requireModuloHabilitado) para
// que apagar un módulo sea real y no solo cosmético.
//
// AuthContext lo trae una vez con GET /modulos/estado y lo expone como
// `modulosHabilitados`; este archivo solo define cómo interpretarlo. Todo lo
// que pertenece a un módulo se etiqueta con `modulo: "gym" | "kinesiologia"`
// en footer_config.jsx / navbar_config.jsx y se filtra con moduloHabilitado().
// ─────────────────────────────────────────────────────────────────────────────

/**
 * true si el módulo está habilitado para este cliente. Un ítem sin `modulo`
 * (null/undefined) se considera transversal y siempre visible (ej. Inicio, Login).
 * Si `modulosHabilitados` todavía no cargó (null), no se oculta de más.
 */
export function moduloHabilitado(modulo, modulosHabilitados) {
  if (modulo == null) return true;
  if (!modulosHabilitados) return true;
  return !!modulosHabilitados[modulo];
}
