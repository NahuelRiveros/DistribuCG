import GestionSuscripcionPage from "../../pages/super_admin/gestion_suscripcion_page.jsx";
import GestionModulosPage from "../../pages/super_admin/gestion_modulos_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const superAdminRoutes = [
  {
    path: "/super-admin/suscripcion",
    element: protegida(<GestionSuscripcionPage />, ["super_admin"]),
  },
  {
    path: "/super-admin/modulos",
    element: protegida(<GestionModulosPage />, ["super_admin"]),
  },
];
