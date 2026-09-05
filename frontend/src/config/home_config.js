/**
 * Contenido del Home — un objeto por cliente en `clientes`, mismo patrón que
 * `clientes`/`clienteActivo` de brand_config.js (de ahí se importa el switch,
 * para no tener dos interruptores de "qué cliente es este" desincronizados).
 * Para el próximo proyecto: sumar una entrada acá con la misma forma que
 * "gc", nunca sobreescribir la existente — así el cliente anterior queda
 * intacto y disponible si hace falta volver a él.
 *
 * Esta es la ÚNICA fuente de este contenido — ya NO se puede pisar desde la
 * base de datos. Antes `home_texto`/`home_pilar`/`home_contacto` tenían
 * prioridad si tenían filas, pero ese camino se eliminó: un seed viejo del
 * template original de gimnasio (seed_home.js, ver servidor/) las
 * repoblaba en cada reinicio del server sin gate de módulo, pisando en
 * silencio el contenido real de acá. home_page.jsx sigue teniendo un
 * fallback a esas tablas por compatibilidad, pero hoy están siempre vacías.
 *
 * hero_kicker y footer_cta_texto no están acá — usan brandConfig.rubro y
 * brandConfig.tagline directo (brand_config.js) para no duplicar el mismo
 * dato de marca en dos archivos de config.
 */

import { Package, Truck, Clock, ShieldCheck } from "lucide-react";
import { clienteActivo } from "./brand_config.js";

const clientes = {
  gc: {
    textos: {
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
    },

    // Chips de la sección "VALOR" — sin conexión a la base, siempre estos 4.
    valor: [
      { icon: Package, label: "Catálogo amplio" },
      { icon: Truck, label: "Entrega puntual" },
      { icon: Clock, label: "Stock al día" },
      { icon: ShieldCheck, label: "Pedidos confiables" },
    ],

    // "Lo que nos diferencia" — mismo shape que HomePilar de la base
    // (id, icono [nombre de ICONOS_HOME], titulo, texto), para que
    // home_page.jsx los use igual sin importar de dónde vienen.
    pilares: [
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
    ],

    // Mismo shape que HomeContacto de la base (id, icono, label, valor, href).
    // Los valores entre corchetes son placeholders reales — completar con los
    // datos del negocio (dirección, WhatsApp, etc.) antes de publicar.
    contactos: [
      { id: "ubicacion", icono: "MapPin", label: "Ubicación", valor: "[Tu dirección acá]", href: "#" },
      { id: "whatsapp", icono: "MessageCircle", label: "WhatsApp", valor: "[Tu número acá]", href: "#" },
    ],
  },

  // Cliente placeholder (ver brand_config.js: "NOMBRE INC" / "RUBRO FUTURO")
  // — completar esta entrada cuando este cliente se active de verdad, nunca
  // reusar/pisar la de "gc".
  moovs: {
    textos: {
      hero_subtitulo: "Completá este texto en home_config.js antes de activar este cliente.",
      hero_cta_primario: "Conocé más",
      hero_cta_secundario: "Contacto",
      pilares_kicker: "Por qué elegirnos",
      pilares_titulo: "Título de pilares,",
      pilares_titulo_resaltado: "a definir",
      galeria_kicker: "Galería",
      galeria_titulo: "Así trabajamos",
      contacto_kicker: "Hablemos",
      contacto_titulo: "Contactanos",
      footer_cta_titulo: "Sumate a",
      footer_cta_titulo_resaltado: "nosotros",
    },
    valor: [],
    pilares: [],
    contactos: [],
  },
};

const contenido = clientes[clienteActivo] ?? clientes.gc;

export const HOME_TEXTOS_DEFAULT = contenido.textos;
export const HOME_VALOR = contenido.valor;
export const HOME_PILARES = contenido.pilares;
export const HOME_CONTACTOS = contenido.contactos;
