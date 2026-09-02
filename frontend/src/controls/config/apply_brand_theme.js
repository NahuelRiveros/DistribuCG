import { brandConfig } from "../../config/brand_config.js";

const CSS_VARS = {
  accent: ["--kt-turquoise", "--color-accent"],
  accentSoft: ["--kt-turquoise-soft", "--color-accent-soft"],
  accentBorder: ["--kt-turquoise-border"],
  primary: ["--kt-petrol", "--kt-teal-700", "--color-primary"],
  primaryDark: ["--kt-night", "--kt-teal-900", "--color-primary-dark"],
  primarySoft: ["--kt-teal-500", "--color-primary-soft"],
  bg: ["--kt-bg"],
  bgSoft: ["--kt-bg-soft"],
  ink: ["--kt-ink"],
  inkSoft: ["--kt-ink-soft"],
  border: ["--kt-border"],
  inkMute: ["--kt-ink-mute"],
  success: ["--kt-success", "--color-success"],
  successBg: ["--kt-success-bg", "--color-success-bg"],
  warning: ["--kt-warning", "--color-warning"],
  warningBg: ["--kt-warning-bg", "--color-warning-bg"],
  danger: ["--kt-danger", "--color-danger"],
  dangerBg: ["--kt-danger-bg", "--color-danger-bg"],
};

function setVar(root, name, value) {
  if (value) root.style.setProperty(name, value);
}

export function applyBrandTheme(config = brandConfig) {
  if (typeof document === "undefined" || !config) return;

  const root = document.documentElement;
  root.dataset.clientBrand = config.nombre;

  Object.entries(config.colores ?? {}).forEach(([key, value]) => {
    (CSS_VARS[key] ?? []).forEach((cssVar) => setVar(root, cssVar, value));
  });

  setVar(root, "--kt-font-display", config.fuentes?.display);
  setVar(root, "--kt-font-body", config.fuentes?.body);
}

applyBrandTheme();
