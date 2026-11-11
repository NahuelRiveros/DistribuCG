import { lazy } from "react";
const GestionSuscripcionPage = lazy(() => import("../../modules/usuarios/super_admin/gestion_suscripcion_page.jsx"));
import { protegida } from "./route_helpers.jsx";

export const superAdminRoutes = [
  {
    path: "/super-admin/suscripcion",
    element: protegida(<GestionSuscripcionPage />, ["super_admin"]),
  },
];
