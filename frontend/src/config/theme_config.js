import { clienteActivo } from "./brand_config.js";
// Overrides por cliente. Los tokens no listados conservan los defaults de index.css.
const themes = {
  gc: { "--kt-teal-700": "#2F4C6B", "--kt-petrol": "#2F4C6B", "--kt-turquoise": "#4FB6C9", "--kt-accent-comercial": "#B45309" },
};
export const themeConfig = themes[clienteActivo] ?? {};
