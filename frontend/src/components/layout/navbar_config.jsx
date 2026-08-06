import {
  Home, ClipboardList, ScanLine, LogIn, UserPlus, CreditCard,
  BarChart2, LayoutDashboard, Shield, Wallet, CalendarClock, Clock, Users,
  Briefcase, Settings, HeartPulse, Stethoscope, Layers, ShoppingCart,
  Megaphone, FileEdit, Volume2, LayoutTemplate, Receipt, KeyRound, ToggleLeft,
} from "lucide-react";
import { brandConfig } from "../../config/brand_config.js";

export const navbar_config = {
  brand: {
    titulo: brandConfig.nombre,
    subtitulo: brandConfig.rubro,
    logoUrl: null,
    mostrarTitulo: true,
    mostrarSubtitulo: true,
    linkTo: "/",
  },

  labels: {
    menuAbrir: "Abrir menú",
    dropdownAbrir: "Abrir submenú",
    seccionDropdownMobile: "Administración",
    botonSalir: "Logout",
  },

  links: [
    { label: "Home",         to: "/", icon: Home },
    { label: "Mi Plan",      to: "/consulta-plan",      ocultarSiAuth: true, icon: ClipboardList },
    { label: "Ingreso",      to: "/kiosk",               requiereAuth: true, roles: ["admin", "staff", "kinesiologo"], modulo: "gym", icon: ScanLine },
    { label: "Login",        to: "/login",               ocultarSiAuth: true, icon: LogIn },
    // Sin `modulo`: registra personas en general (alumno y/o paciente de kinesiología).
    { label: "Registro",     to: "/register",            requiereAuth: true, roles: ["admin", "staff", "kinesiologo"], icon: UserPlus },
    {
      label: "Registrar pago",
      to: "/admin/pagos/registrar",
      requiereAuth: true,
      roles: ["admin", "staff", "kinesiologo"],
      modulo: "gym",
      icon: CreditCard,
    },
  ],

  dropdowns: [
    {
      id: "estadisticas",
      labelNoAuth: "Estadísticas",
      labelAuth: "Estadísticas",
      icon: BarChart2,
      items: [
        {
          label: "Recaudación mensual",
          to: "/estadisticas/recaudaciones-mensual",
          requiereAuth: true,
          roles: ["admin"],
          modulo: "gym",
          icon: Wallet,
        },
        {
          label: "Alumnos nuevos",
          to: "/admin/estadisticas/alumnos-nuevos",
          requiereAuth: true,
          roles: ["admin"],
          modulo: "gym",
          icon: UserPlus,
        },
        {
          label: "Vencimientos próximos",
          to: "/admin/estadisticas/vencimientos",
          requiereAuth: true,
          roles: ["admin"],
          modulo: "gym",
          icon: CalendarClock,
        },
        {
          label: "Frecuencia horaria",
          to: "/admin/estadisticas/heatmap",
          requiereAuth: true,
          roles: ["admin"],
          modulo: "gym",
          icon: Clock,
        },
        {
          label: "Listado de alumnos",
          to: "/admin/estadisticas/alumnos",
          requiereAuth: true,
          roles: ["admin", "staff", "kinesiologo"],
          modulo: "gym",
          icon: Users,
        },
      ],
    },
    {
      // Propio, separado de "admin" — visible solo para quien atiende
      // kinesiología (más el admin, que ve todo).
      id: "kinesiologia",
      labelNoAuth: "Kinesiología",
      labelAuth: "Kinesiología",
      icon: HeartPulse,
      items: [
        {
          label: "Pacientes de kinesiología",
          to: "/admin/kinesiologia",
          requiereAuth: true,
          roles: ["admin", "kinesiologo"],
          modulo: "kinesiologia",
          icon: Users,
        },
        {
          label: "Patologías",
          to: "/admin/kinesiologia/patologias",
          requiereAuth: true,
          roles: ["admin", "kinesiologo"],
          modulo: "kinesiologia",
          icon: Stethoscope,
        },
      ],
    },
    {
      id: "admin",
      labelNoAuth: "Admin",
      labelAuth: "Admin",
      icon: LayoutDashboard,
      items: [
        {
          // Grupo: operación diaria del negocio
          label: "Gestión",
          icon: Briefcase,
          requiereAuth: true,
          roles: ["admin", "staff", "kinesiologo"],
          children: [
            { label: "Planes",               to: "/admin/planesViews",         requiereAuth: true, roles: ["admin"], modulo: "gym", icon: Layers },
            { label: "Ventas",                to: "/admin/ventas",              requiereAuth: true, roles: ["admin", "staff", "kinesiologo"], modulo: "gym", icon: ShoppingCart },
            { label: "Personal",              to: "/admin/staffManager",        requiereAuth: true, roles: ["admin"], icon: Users },
            { label: "Promociones",           to: "/admin/promociones",         requiereAuth: true, roles: ["admin"], modulo: "gym", icon: Megaphone },
            { label: "Editar plan de alumno", to: "/admin/alumnos/editar-plan", requiereAuth: true, roles: ["admin"], modulo: "gym", icon: FileEdit },
          ],
        },
        {
          // Grupo: ajustes que se tocan poco
          label: "Configuración",
          icon: Settings,
          requiereAuth: true,
          roles: ["admin", "staff", "kinesiologo"],
          children: [
            { label: "Volumen de avisos", to: "/admin/config-audio", requiereAuth: true, roles: ["admin", "staff", "kinesiologo"], icon: Volume2 },
            { label: "Contenido del home", to: "/admin/home-config", requiereAuth: true, roles: ["admin"], icon: LayoutTemplate },
            { label: "Suscripción",        to: "/admin/suscripcion",  requiereAuth: true, roles: ["admin"], icon: Receipt },
          ],
        },
      ],
    },
    {
      id: "super_admin",
      labelNoAuth: "Sistema",
      labelAuth: "Sistema",
      icon: Shield,
      items: [
        {
          label: "Suscripción del sistema",
          to: "/super-admin/suscripcion",
          requiereAuth: true,
          roles: ["super_admin"],
          icon: KeyRound,
        },
        {
          label: "Módulos habilitados",
          to: "/super-admin/modulos",
          requiereAuth: true,
          roles: ["super_admin"],
          icon: ToggleLeft,
        },
      ],
    },
  ],
};
