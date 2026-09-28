// Zod con mensajes por defecto en español. Importar SIEMPRE `z` desde acá
// (no desde "zod") para que ningún error llegue en inglés al usuario.
// Se importa solo el idioma español: z.locales trae todos y agranda el bundle.
import { z } from "zod";
import es from "zod/v4/locales/es.js";

z.config(es());

export { z };
