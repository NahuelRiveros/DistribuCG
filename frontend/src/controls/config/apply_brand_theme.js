import { brandConfig } from "../../config/brand_config.js";
import { themeConfig } from "../../config/theme_config.js";
for (const [name, value] of Object.entries(themeConfig)) document.documentElement.style.setProperty(name, value);
if (brandConfig.fuentes?.display) document.documentElement.style.setProperty("--kt-font-display", brandConfig.fuentes.display);
if (brandConfig.fuentes?.body) document.documentElement.style.setProperty("--kt-font-body", brandConfig.fuentes.body);
