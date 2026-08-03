import {
  ScanLine, Users, CreditCard, BarChart2, Home, LogIn,
  Dumbbell, Activity, HeartPulse, Trophy,
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
      "Centro de entrenamiento y kinesiología. Seguimiento personalizado de cada ejercicio, alumnos, planes y estadísticas en un solo lugar.",
    estadoLabel: "Sistema activo",
    selloLabel: "Gestión · Rendimiento · Control",
  },

  // ── Módulos del sistema ──────────────────────────────────────────────────
  // "codigo" coincide con Modulo.codigo del backend (servidor/src/database/seed.js)
  modulos: [
    {
      codigo: "kiosco",
      modulo: "gym",
      habilitado: true,
      icon: ScanLine,
      code: "MOD-01",
      titulo: "Control de ingreso",
      texto: "Registro de asistencia por DNI en tiempo real",
    },
    {
      codigo: "alumnos",
      modulo: "gym",
      habilitado: true,
      icon: Users,
      code: "MOD-02",
      titulo: "Gestión de alumnos",
      texto: "Alta, seguimiento y estado de cada alumno",
    },
    {
      codigo: "pagos",
      modulo: "gym",
      habilitado: true,
      icon: CreditCard,
      code: "MOD-03",
      titulo: "Planes y pagos",
      texto: "Administración de planes vigentes y cobros",
    },
    {
      codigo: "kinesiologia",
      modulo: "kinesiologia",
      habilitado: true,
      icon: HeartPulse,
      code: "MOD-04",
      titulo: "Kinesiología",
      texto: "Fichas, evaluación inicial y seguimiento de pacientes",
    },
    {
      codigo: "estadisticas",
      modulo: "gym",
      habilitado: true,
      icon: BarChart2,
      code: "MOD-05",
      titulo: "Estadísticas",
      texto: "Asistencia, recaudación y análisis del gimnasio",
    },
  ],

  // ── Acceso rápido ────────────────────────────────────────────────────────
  accesos: [
    { codigo: "home",         modulo: null,           habilitado: true, icon: Home,       label: "Inicio",                    to: "/" },
    { codigo: "kiosco",       modulo: "gym",          habilitado: true, icon: ScanLine,   label: "Ingreso / Kiosk",           to: "/kiosk" },
    { codigo: "kinesiologia", modulo: "kinesiologia", habilitado: true, icon: HeartPulse, label: "Pacientes de kinesiología", to: "/admin/kinesiologia" },
    { codigo: "login",        modulo: null,           habilitado: true, icon: LogIn,      label: "Iniciar sesión",            to: "/login" },
    { codigo: "alumnos",      modulo: "gym",          habilitado: true, icon: Users,      label: "Lista de alumnos",          to: "/admin/estadisticas/alumnos" },
  ],

  // ── ¿Por qué elegirnos? ──────────────────────────────────────────────────
  diferenciales: [
    { modulo: "gym",          habilitado: true, icon: Dumbbell,   titulo: "Personalizado", texto: "Plan de entrenamiento a tu medida" },
    { modulo: "gym",          habilitado: true, icon: Activity,   titulo: "Seguimiento",   texto: "Registro de cada ejercicio y avance" },
    { modulo: "kinesiologia", habilitado: true, icon: HeartPulse, titulo: "Kinesiología",  texto: "Recuperación y rehabilitación guiada" },
    { modulo: null,           habilitado: true, icon: Trophy,     titulo: "Resultados",    texto: "Progreso medible, sesión a sesión" },
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
