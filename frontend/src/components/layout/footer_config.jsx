import {
  ScanLine, Dumbbell, Activity, HeartPulse, Trophy,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DEL FOOTER — pensado para poder reusar Kinetica en otro cliente
// cambiando solo este archivo (no footer.jsx).
//
// Cada módulo/acceso lleva `modulo: "gym" | "kinesiologia"` (o sin `modulo`
// si es transversal, ej. Inicio). El on/off real de Gym y Kinesiología vive
// en un solo lugar: config/modulos_config.js — acá no se apaga nada a mano,
// footer.jsx filtra según ese archivo. `habilitado: false` queda disponible
// para apagar un ítem puntual sin tocar el módulo entero.
// ─────────────────────────────────────────────────────────────────────────────

export const footer_config = {

  marca: {
    nombre: "Kinetica",
    tagline:
      "Entrenamiento y kinesiología con profesionales que acompañan de cerca cada objetivo, sesión a sesión — no una rutina genérica.",
    estadoLabel: "Sistema activo",
    selloLabel: "Gestión · Rendimiento · Control",
  },

  // ── Nuestro enfoque ──────────────────────────────────────────────────────
  // A diferencia de "accesos" (links funcionales), esto es contenido de marca:
  // por qué importa cada disciplina y qué acompañamiento reciben. Se filtra
  // por módulo igual que el resto — un cliente solo-gym no ve las de kinesio.
  enfoque: [
    {
      codigo: "por-que-kinesiologia",
      modulo: "kinesiologia",
      habilitado: true,
      icon: HeartPulse,
      code: "01",
      titulo: "Por qué kinesiología",
      texto: "Previene lesiones, acelera recuperaciones y sostiene el movimiento a largo plazo — no solo cuando algo duele.",
    },
    {
      codigo: "acompanamiento",
      modulo: "kinesiologia",
      habilitado: true,
      icon: Activity,
      code: "02",
      titulo: "Acompañamiento profesional",
      texto: "Evaluación inicial, objetivos claros y seguimiento sesión a sesión con un kinesiólogo, no una rutina genérica.",
    },
    {
      codigo: "entrenamiento",
      modulo: "gym",
      habilitado: true,
      icon: Dumbbell,
      code: "03",
      titulo: "Entrenamiento con propósito",
      texto: "Planes armados según tu objetivo real, con seguimiento de cada ejercicio y ajustes en el camino.",
    },
    {
      codigo: "asistencia",
      modulo: "gym",
      habilitado: true,
      icon: ScanLine,
      code: "04",
      titulo: "Constancia que se nota",
      texto: "Registro de cada ingreso y avance, para que el progreso quede a la vista y no se pierda en el camino.",
    },
  ],

  // ── ¿Por qué elegirnos? ──────────────────────────────────────────────────
  diferenciales: [
    { modulo: "gym",          habilitado: true, icon: Dumbbell,   titulo: "A tu medida",      texto: "Un plan pensado para tu objetivo, no una tabla genérica" },
    { modulo: "kinesiologia", habilitado: true, icon: HeartPulse, titulo: "Mirada clínica",   texto: "Evaluación profesional antes de cada tratamiento" },
    { modulo: "gym",          habilitado: true, icon: Activity,   titulo: "Seguimiento real", texto: "Cada sesión queda registrada, no se pierde en el camino" },
    { modulo: null,           habilitado: true, icon: Trophy,     titulo: "Resultados",       texto: "Progreso medible, sesión a sesión" },
  ],

  callout: {
    titulo: "Constancia > Motivación",
    texto: "El progreso se construye día a día.",
  },

  legal: {
    // Nombre que aparece en el copyright — normalmente el mismo que marca.nombre,
    // pero puede diferir (ej. razón social) si un cliente lo pide.
    nombreDerechos: "Kinetica",
    mostrarDesarrolladoPor: true,
    desarrolladoPor: "Riveros Edgardo Nahuel",
  },
};
