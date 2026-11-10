import { LineChart, ShieldCheck } from "lucide-react";
import { brandConfig } from "./brand_config.js";

// Contenido del footer. Cada ítem puede llevar `modulo: "<codigo>"` para mostrarse solo con
// ese rubro activo; `habilitado: false` apaga un ítem puntual.
export const footer_config = {
  marca: {
    tagline: brandConfig.tagline,
    estadoLabel: "Sistema activo",
    selloLabel: "[COMPLETAR · qué hace el negocio]",
  },
  diferenciales: [
    { modulo: null, habilitado: true, icon: LineChart, titulo: "[COMPLETAR]", texto: "[COMPLETAR]" },
    { modulo: null, habilitado: true, icon: ShieldCheck, titulo: "[COMPLETAR]", texto: "[COMPLETAR]" },
  ],
  callout: { titulo: "[COMPLETAR]", texto: "[COMPLETAR]" },
  legal: {
    nombreDerechos: brandConfig.razonSocial || brandConfig.nombre,
    mostrarDesarrolladoPor: true,
    desarrolladoPor: "Riveros Edgardo Nahuel",
  },
};
