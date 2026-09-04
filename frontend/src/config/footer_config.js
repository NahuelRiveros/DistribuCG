import { Package, Truck, LineChart, ShieldCheck } from "lucide-react";
import { brandConfig } from "./brand_config.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DEL FOOTER — pensado para reusar esta base en otro cliente/proyecto
// cambiando solo este archivo (no footer.jsx).
//
// Cada ítem puede llevar `modulo: "<codigo>"` (o sin `modulo` si es
// transversal). El on/off real de un módulo de negocio vive en un solo
// lugar: config/modulos_config.js — acá no se apaga nada a mano, footer.jsx
// filtra según ese archivo. `habilitado: false` apaga un ítem puntual sin
// tocar el módulo entero.
// ─────────────────────────────────────────────────────────────────────────────

export const footer_config = {
  marca: {
    tagline: brandConfig.tagline,
    estadoLabel: "Sistema activo",
    selloLabel: "Pedidos · Stock · Entregas",
  },

  // ── Nuestro enfoque ──────────────────────────────────────────────────────
  // A diferencia de "accesos" (links funcionales), esto es contenido de marca.
  enfoque: [
    {
      codigo: "enfoque-1",
      modulo: null,
      habilitado: true,
      icon: Package,
      code: "01",
      titulo: "Catálogo amplio",
      texto: "Cientos de productos organizados por categoría, fáciles de encontrar y pedir.",
    },
    {
      codigo: "enfoque-2",
      modulo: null,
      habilitado: true,
      icon: Truck,
      code: "02",
      titulo: "Entrega confiable",
      texto: "Coordinamos cada pedido para que llegue completo y a tiempo.",
    },
  ],

  // ── ¿Por qué elegirnos? ──────────────────────────────────────────────────
  diferenciales: [
    {
      modulo: null,
      habilitado: true,
      icon: LineChart,
      titulo: "Stock actualizado",
      texto: "Precios y disponibilidad al día, sin sorpresas al momento de pedir.",
    },
    {
      modulo: null,
      habilitado: true,
      icon: ShieldCheck,
      titulo: "Pedidos confiables",
      texto: "Cada nota de pedido queda registrada y se procesa de forma prolija.",
    },
  ],

  callout: {
    titulo: "Constancia > Improvisación",
    texto: "Cada pedido, la misma calidad de siempre.",
  },

  legal: {
    // Nombre que aparece en el copyright — normalmente el mismo que la marca
    // del logo, pero puede diferir (ej. razón social) si un cliente lo pide.
    nombreDerechos: brandConfig.nombre,
    mostrarDesarrolladoPor: true,
    desarrolladoPor: "Riveros Edgardo Nahuel",
  },
};
