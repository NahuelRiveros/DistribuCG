/**
 * Identidad del cliente: nombre, logo y fuentes. La paleta está en theme_config.js.
 * Se elige con `id` de proyecto/client_config.js.
 */
import { clientConfig } from "../../../../proyecto/client_config.js";

export const clientes = {
  ejemplo: {
    nombre: "[COMPLETAR nombre]",
    nombreCorto: "[COMPLETAR]",
    rubro: "[COMPLETAR rubro]",
    tagline: "[COMPLETAR frase corta].",
    // "gc-mark" muestra las imágenes de logo_config.js.
    logo: { tipo: "gc-mark", texto: "[COMPLETAR]", ariaLabel: "[COMPLETAR nombre]" },
    fuentes: {
      display: "'Bricolage Grotesque', sans-serif",
      body: "'Plus Jakarta Sans', sans-serif",
    },
  },
};

export const clienteActivo = clientConfig.id;
export const brandConfig = clientes[clienteActivo];
