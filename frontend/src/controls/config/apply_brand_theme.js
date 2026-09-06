import { brandConfig } from "../../config/brand_config.js";

// Los colores de marca viven solo en src/index.css (:root) — ya no se
// pisan acá en runtime. Esto sigue existiendo para lo que brand_config.js
// SÍ define por cliente y no tiene lugar en un CSS estático: la fuente
// (variable, no un valor fijo) y el nombre en el DOM para debug/CSS hooks.
function setVar(root, name, value) {
  if (value) root.style.setProperty(name, value);
}

export function applyBrandTheme(config = brandConfig) {
  if (typeof document === "undefined" || !config) return;

  const root = document.documentElement;
  root.dataset.clientBrand = config.nombre;

  setVar(root, "--kt-font-display", config.fuentes?.display);
  setVar(root, "--kt-font-body", config.fuentes?.body);
}

applyBrandTheme();
