import {
  LayoutDashboard,
  Users,
  Layers,
  ShoppingCart,
  Megaphone,
  FileEdit,
  Settings,
  LayoutTemplate,
  Receipt,
} from "lucide-react";
import { projectModules } from "../gate_config.js";

// Dropdown de primer nivel con 2 ítems que además tienen `children` (un
// nivel más de anidamiento, ya soportado por navbar_permissions.js). Todo
// en este único archivo — nada se importa de gym_dropdown.js ni de ningún
// otro lado, para no armar cadenas de imports entre archivos de navbar_config.
export const adminDropdown = {
  id: "admin",
  labelNoAuth: "Admin",
  labelAuth: "Admin",
  icon: LayoutDashboard,
  items: [
    {
      label: "Gestión",
      icon: Users,
      requiereAuth: true,
      roles: ["admin"],
      children: [
        {
          label: "Personal",
          to: "/admin/staffManager",
          requiereAuth: true,
          roles: ["admin"],
          icon: Users,
        },
        ...(projectModules.gym
          ? [
              {
                label: "Planes",
                to: "/admin/planesViews",
                requiereAuth: true,
                modulo: "gym",
                roles: ["admin"],
                icon: Layers,
              },
              {
                label: "Ventas",
                to: "/admin/ventas",
                requiereAuth: true,
                modulo: "gym",
                roles: ["admin", "staff", "profesional"],
                icon: ShoppingCart,
              },
              {
                label: "Promociones",
                to: "/admin/promociones",
                requiereAuth: true,
                modulo: "gym",
                roles: ["admin"],
                icon: Megaphone,
              },
              {
                label: "Editar plan de alumno",
                to: "/admin/alumnos/editar-plan",
                requiereAuth: true,
                modulo: "gym",
                roles: ["admin"],
                icon: FileEdit,
              },
            ]
          : []),
      ],
    },
    {
      label: "Configuración",
      icon: Settings,
      requiereAuth: true,
      roles: ["admin"],
      children: [
        {
          label: "Contenido del home",
          to: "/admin/home-config",
          requiereAuth: true,
          roles: ["admin"],
          icon: LayoutTemplate,
        },
        {
          label: "Suscripción",
          to: "/admin/suscripcion",
          requiereAuth: true,
          roles: ["admin"],
          icon: Receipt,
        },
      ],
    },
  ],
};
