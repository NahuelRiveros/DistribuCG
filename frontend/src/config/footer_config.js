import { Sparkles, ShieldCheck, LineChart, Trophy } from "lucide-react";
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
//
// El contenido de abajo es placeholder genérico — reemplazar por lo real de
// cada cliente al iniciar un proyecto nuevo.
// ─────────────────────────────────────────────────────────────────────────────

export const footer_config = {
  marca: {
    tagline: brandConfig.tagline,
    estadoLabel: "Sistema activo",
    selloLabel: "Gestión · Rendimiento · Control",
  },

  // ── Nuestro enfoque ──────────────────────────────────────────────────────
  // A diferencia de "accesos" (links funcionales), esto es contenido de marca.
  enfoque: [
    {
      codigo: "enfoque-1",
      modulo: null,
      habilitado: true,
      icon: Sparkles,
      code: "01",
      titulo: "Enfoque 1",
      texto: "Placeholder — reemplazar con el diferencial real del cliente.",
    },
    {
      codigo: "enfoque-2",
      modulo: null,
      habilitado: true,
      icon: ShieldCheck,
      code: "02",
      titulo: "Enfoque 2",
      texto: "Placeholder — reemplazar con el diferencial real del cliente.",
    },
  ],

  // ── ¿Por qué elegirnos? ──────────────────────────────────────────────────
  diferenciales: [
    {
      modulo: null,
      habilitado: true,
      icon: LineChart,
      titulo: "Seguimiento real",
      texto: "Placeholder — reemplazar por copy real",
    },
    {
      modulo: null,
      habilitado: true,
      icon: Trophy,
      titulo: "Resultados",
      texto: "Placeholder — reemplazar por copy real",
    },
  ],

  callout: {
    titulo: "Constancia > Motivación",
    texto: "El progreso se construye día a día.",
  },

  legal: {
    // Nombre que aparece en el copyright — normalmente el mismo que la marca
    // del logo, pero puede diferir (ej. razón social) si un cliente lo pide.
    nombreDerechos: brandConfig.nombre,
    mostrarDesarrolladoPor: true,
    desarrolladoPor: "Riveros Edgardo Nahuel",
  },
};
