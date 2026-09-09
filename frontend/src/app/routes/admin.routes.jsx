import { lazy } from "react";
const StaffPage = lazy(() => import("../../modules/usuarios/admin/staff_page.jsx"));
const SuscripcionPage = lazy(() => import("../../modules/usuarios/admin/suscripcion_page.jsx"));
const HomeConfigPage = lazy(() => import("../../modules/home/admin/home_config_page.jsx"));
import { protegida } from "./route_helpers.jsx";

export const adminRoutes = [
  { path: "/admin/staffManager", element: protegida(<StaffPage />, ["admin"]) },
  { path: "/admin/suscripcion", element: protegida(<SuscripcionPage />, ["admin"]) },
  { path: "/admin/home-config", element: protegida(<HomeConfigPage />, ["admin"]) },
];
