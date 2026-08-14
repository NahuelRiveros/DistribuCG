import PlanesPage from "../../pages/admin/planes_page.jsx";
import StaffPage from "../../pages/admin/staff_page.jsx";
import EditarPlanVigentePage from "../../pages/admin/editar_plan_vigente_page.jsx";
import SuscripcionPage from "../../pages/admin/suscripcion_page.jsx";
import PromocionesPage from "../../pages/admin/promociones_page.jsx";
import AudioConfigPage from "../../pages/admin/audio_config_page.jsx";
import HomeConfigPage from "../../pages/admin/home_config_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const adminRoutes = [
  { path: "/admin/planesViews", element: protegida(<PlanesPage />, ["admin"]) },
  { path: "/admin/staffManager", element: protegida(<StaffPage />, ["admin"]) },
  {
    path: "/admin/alumnos/editar-plan",
    element: protegida(<EditarPlanVigentePage />, ["admin"]),
  },
  { path: "/admin/suscripcion", element: protegida(<SuscripcionPage />, ["admin"]) },
  { path: "/admin/promociones", element: protegida(<PromocionesPage />, ["admin"]) },
  {
    path: "/admin/config-audio",
    element: protegida(<AudioConfigPage />, ["admin", "staff", "kinesiologo"]),
  },
  { path: "/admin/home-config", element: protegida(<HomeConfigPage />, ["admin"]) },
];
