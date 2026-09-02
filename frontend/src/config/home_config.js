/**
 * Contenido por defecto del Home.
 *
 * Estos valores solo se ven si la clave correspondiente todavía no tiene
 * una fila (o está vacía) en `home_texto` — el panel /admin/home-config y
 * el seed del backend (seed_home_contenido()) tienen prioridad. Sirven como
 * el "piso" de lo que se ve en una instalación nueva y como red de
 * seguridad si algún texto se borra desde el panel.
 *
 * hero_kicker y footer_cta_texto no están acá — usan brandConfig.rubro y
 * brandConfig.tagline directo (brand_config.js) para no duplicar el mismo
 * dato de marca en dos archivos de config.
 */

import { Target, LineChart, UserCheck, Sparkles } from "lucide-react";

export const HOME_TEXTOS_DEFAULT = {
  hero_subtitulo:
    "Placeholder — reemplazar con la propuesta de valor real del cliente.",
  hero_cta_primario: "Conocenos",
  hero_cta_secundario: "Contacto",
  pilares_kicker: "Nuestro fuerte",
  pilares_titulo: "Lo que nos",
  pilares_titulo_resaltado: "diferencia",
  galeria_kicker: "Lo que hacemos",
  galeria_titulo: "Conocé el espacio",
  contacto_kicker: "Hablemos",
  contacto_titulo: "Empezá hoy",
  footer_cta_titulo: "Empezá",
  footer_cta_titulo_resaltado: "ahora",
};

// Chips de la sección "VALOR" — sin conexión a la base, siempre estos 4.
// Placeholder — reemplazar por los reales de cada cliente.
export const HOME_VALOR = [
  { icon: Target, label: "A tu medida" },
  { icon: UserCheck, label: "Acompañamiento" },
  { icon: LineChart, label: "Seguimiento real" },
  { icon: Sparkles, label: "Resultados" },
];
