import { LineChart, ShieldCheck } from "lucide-react";
import { brandConfig } from "./brand_config.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DEL FOOTER — pensado para reusar esta base en otro cliente/proyecto
// cambiando solo este archivo (no footer.jsx).
//
// `habilitado: false` apaga un ítem puntual.
// ─────────────────────────────────────────────────────────────────────────────

export const footer_config = {
  marca: {
    tagline: brandConfig.tagline,
    estadoLabel: "Sistema activo",
    selloLabel: "Pedidos · Stock · Entregas",
  },

  // ── ¿Por qué elegirnos? ──────────────────────────────────────────────────
  diferenciales: [
    {
      habilitado: true,
      icon: LineChart,
      titulo: "Stock actualizado",
      texto: "Precios y disponibilidad al día, sin sorpresas al momento de pedir.",
    },
    {
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
    // Nombre que aparece en el copyright — razón social si está definida
    // (con S.R.L./S.A./etc.), si no la marca comercial de siempre.
    nombreDerechos: brandConfig.razonSocial || brandConfig.nombre,
    mostrarDesarrolladoPor: true,
    desarrolladoPor: "Riveros Edgardo Nahuel",
  },
};
