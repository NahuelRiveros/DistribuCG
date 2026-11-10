// Contenido del inicio: es la única fuente de estos textos. El nombre de la empresa no se
// escribe acá: sale de brand_config.js.
import { brandConfig } from "./brand_config.js";

export const HOME_TEXTOS_DEFAULT = {
  hero_titulo: brandConfig.nombre,
  hero_titulo_resaltado: brandConfig.tagline,
  hero_subtitulo: "[COMPLETAR qué ofrece el negocio]",
  hero_cta_primario: "Conocé más",
  hero_cta_secundario: "Contacto",
  quienes_kicker: "Quiénes somos",
  quienes_titulo: "[COMPLETAR]",
  quienes_titulo_resaltado: "[COMPLETAR]",
  // Se lee seguido de "Somos {nombre}: ...".
  quienes_texto: "[COMPLETAR]",
  como_pedir_kicker: "Así es de simple",
  como_pedir_titulo: "Cómo funciona",
  pilares_kicker: "Por qué elegirnos",
  pilares_titulo: "[COMPLETAR]",
  pilares_titulo_resaltado: "[COMPLETAR]",
  galeria_kicker: "Galería",
  galeria_titulo: "Así trabajamos",
  contacto_kicker: "Hablemos",
  contacto_titulo: "Contactanos",
  footer_cta_titulo: "Sumate a",
  footer_cta_titulo_resaltado: brandConfig.nombreCorto,
};
// Chips { icon, label }, pasos { numero, titulo, texto }, pilares { id, icono, titulo, texto }
// y contactos { id, icono, label, valor, href }. Vacíos no se muestran.
export const HOME_VALOR = [];
export const HOME_COMO_PEDIR = [];
export const HOME_PILARES = [];
export const HOME_CONTACTOS = [
  { id: "ubicacion", icono: "MapPin", label: "Ubicación", valor: "[COMPLETAR dirección]", href: "#" },
  { id: "whatsapp", icono: "MessageCircle", label: "WhatsApp", valor: "[COMPLETAR número]", href: "#" },
];
// Textos de la tienda (los usa un rubro con catálogo).
export const HOME_TIENDA = {};
