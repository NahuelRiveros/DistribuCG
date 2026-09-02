// CATÁLOGO DE PRODUCTOS — config por proyecto/cliente.
// Cómo se navega el catálogo, qué links aparecen en el menú y cómo se llaman
// las categorías. enabled lee de gate_config.js (el gate maestro) — controla
// si "Catálogos" y "Alertas de stock" aparecen en el menú Admin.
import { projectModules } from "./gate_config.js";

export const catalogConfig = {

  // Admin → Catálogo (Catálogos, Alertas de stock) solo aparece si esto es true.
  enabled: projectModules.eccomerce_indumentaria,

  // ── Navegación ─────────────────────────────────────────────────────────────
  basePath: "/catalogo",

  showHomeLink: true,
  showProductsLink: true,
  // ¿Mostrar los grupos/colecciones como items en el menú?
  showGroupsInNavbar: true,
  // false = link directo a productos / true = dropdown con productos al pasar el cursor
  showProductsDropdown: false,
  showAboutLink: false,
  showContactLink: false,

  // ── Textos del menú ────────────────────────────────────────────────────────
  navProductsLabel: "Productos",
  navHomeLabel: "Home",
  navAboutLabel: "Nosotros",
  navContactLabel: "Contacto",

  // ── Cómo se llaman las categorías en este negocio ──────────────────────────
  // Aparecen en filtros, breadcrumbs y menús del catálogo. Renombrar según el
  // rubro (ej. "Departamento"/"Categoría"/"Subcategoría" para un bazar).
  groupLabel: "Colección",
  categoryLabel: "Categoría",
  subcategoryLabel: "Subcategoría",

  // Ruta de fallback si la categoría buscada no existe
  categoryFallbackPath: "/catalogo",
};
