import StaffPage from "../../modules/usuarios/admin/staff_page.jsx";
import SuscripcionPage from "../../modules/usuarios/admin/suscripcion_page.jsx";
import HomeConfigPage from "../../modules/home/admin/home_config_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const adminRoutes = [
  { path: "/admin/staffManager", element: protegida(<StaffPage />, ["admin"]) },
  { path: "/admin/suscripcion", element: protegida(<SuscripcionPage />, ["admin"]) },
  { path: "/admin/home-config", element: protegida(<HomeConfigPage />, ["admin"]) },
];
