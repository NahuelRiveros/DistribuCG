/**
 * Contenido del Home — GC Distribuidora.
 *
 * Esta es la ÚNICA fuente de estos textos: no dependen de ninguna fila en
 * base de datos ni del panel /admin/home-config. Editar acá y listo — no
 * hace falta tocar nada más para que se refleje en el home público.
 * (Antes, `home_texto`/`home_pilar`/`home_contacto` en la base tenían
 * prioridad sobre este archivo; se vaciaron esas tablas justamente para que
 * este archivo mande. Si en algún momento se vuelve a cargar contenido
 * desde el panel, ESE contenido pasa a tener prioridad de nuevo — ver
 * home_page.jsx, que usa este archivo solo como resultado de "no hay nada
 * cargado en el panel".)
 *
 * hero_kicker y footer_cta_texto no están acá — usan brandConfig.rubro y
 * brandConfig.tagline directo (brand_config.js) para no duplicar el mismo
 * dato de marca en dos archivos de config.
 */

import { Package, Truck, Clock, ShieldCheck } from "lucide-react";

export const HOME_TEXTOS_DEFAULT = {
  hero_subtitulo:
    "Miles de productos, stock actualizado y despacho puntual — armá tu pedido online y nosotros nos encargamos del resto.",
  hero_cta_primario: "Conocé más",
  hero_cta_secundario: "Contacto",
  pilares_kicker: "Por qué elegirnos",
  pilares_titulo: "Distribución mayorista,",
  pilares_titulo_resaltado: "sin vueltas",
  galeria_kicker: "Nuestro depósito",
  galeria_titulo: "Así trabajamos",
  contacto_kicker: "Hablemos",
  contacto_titulo: "Hacé tu pedido",
  footer_cta_titulo: "Pedí con",
  footer_cta_titulo_resaltado: "GC",
};

// Chips de la sección "VALOR" — sin conexión a la base, siempre estos 4.
export const HOME_VALOR = [
  { icon: Package, label: "Catálogo amplio" },
  { icon: Truck, label: "Entrega puntual" },
  { icon: Clock, label: "Stock al día" },
  { icon: ShieldCheck, label: "Pedidos confiables" },
];

// "Lo que nos diferencia" — mismo shape que HomePilar de la base
// (id, icono [nombre de ICONOS_HOME], titulo, texto), para que
// home_page.jsx los use igual sin importar de dónde vienen.
export const HOME_PILARES = [
  {
    id: "catalogo",
    icono: "Package",
    titulo: "Catálogo siempre actualizado",
    texto: "Productos organizados por categoría, con precios y stock al día para armar tu pedido sin sorpresas.",
  },
  {
    id: "entregas",
    icono: "Truck",
    titulo: "Entrega puntual",
    texto: "Coordinamos el despacho de cada pedido y te avisamos su estado — sin vueltas, sin esperas innecesarias.",
  },
];

// Mismo shape que HomeContacto de la base (id, icono, label, valor, href).
// Los valores entre corchetes son placeholders reales — completar con los
// datos del negocio (dirección, WhatsApp, etc.).
export const HOME_CONTACTOS = [
  { id: "ubicacion", icono: "MapPin", label: "Ubicación", valor: "[Tu dirección acá]", href: "#" },
  { id: "whatsapp", icono: "MessageCircle", label: "WhatsApp", valor: "[Tu número acá]", href: "#" },
];
