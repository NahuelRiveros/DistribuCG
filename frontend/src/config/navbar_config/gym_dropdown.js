import {
  ClipboardList,
  ScanLine,
  CreditCard,
  BarChart2,
  Wallet,
  UserPlus,
  CalendarClock,
  Clock,
  Users,
} from "lucide-react";

// Contribución de gym al navbar: links sueltos (Mi Plan/Ingreso/Registrar
// pago) y el dropdown "Estadísticas". Los ítems de gym que aparecen dentro
// de "Gestión" (Planes, Ventas, Promociones, Editar plan) viven en
// admin_dropdown.js, no acá — ese archivo es dueño de todo su árbol, no
// importa nada de este. Cada ítem lleva modulo: "gym" para el toggle en
// vivo — el gate maestro (projectModules.gym, de gate_config.js) se aplica
// en main.js, que es quien decide si este archivo se usa o no.
export const gymLinks = [
  {
    label: "Mi Plan",
    to: "/consulta-plan",
    ocultarSiAuth: true,
    modulo: "gym",
    icon: ClipboardList,
  },
  {
    label: "Ingreso",
    to: "/kiosk",
    requiereAuth: true,
    modulo: "gym",
    roles: ["admin", "staff", "profesional"],
    icon: ScanLine,
  },
  {
    label: "Registrar pago",
    to: "/admin/pagos/registrar",
    requiereAuth: true,
    modulo: "gym",
    roles: ["admin", "staff", "profesional"],
    icon: CreditCard,
  },
];

export const gymDropdown = {
  id: "estadisticas",
  labelNoAuth: "Estadísticas",
  labelAuth: "Estadísticas",
  icon: BarChart2,
  items: [
    {
      label: "Recaudación mensual",
      to: "/estadisticas/recaudaciones-mensual",
      requiereAuth: true,
      modulo: "gym",
      roles: ["admin"],
      icon: Wallet,
    },
    {
      label: "Alumnos nuevos",
      to: "/admin/estadisticas/alumnos-nuevos",
      requiereAuth: true,
      modulo: "gym",
      roles: ["admin"],
      icon: UserPlus,
    },
    {
      label: "Vencimientos próximos",
      to: "/admin/estadisticas/vencimientos",
      requiereAuth: true,
      modulo: "gym",
      roles: ["admin"],
      icon: CalendarClock,
    },
    {
      label: "Frecuencia horaria",
      to: "/admin/estadisticas/heatmap",
      requiereAuth: true,
      modulo: "gym",
      roles: ["admin"],
      icon: Clock,
    },
    {
      label: "Listado de alumnos",
      to: "/admin/estadisticas/alumnos",
      requiereAuth: true,
      modulo: "gym",
      roles: ["admin", "staff", "profesional"],
      icon: Users,
    },
  ],
};
