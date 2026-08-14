import RecaudacionCalendario from "../../pages/estadisticas/recaudacion_mensual_page.jsx";
import RecaudacionCalendarioDia from "../../pages/estadisticas/recaudacion_diaria_page.jsx";
import AlumnosNuevosPage from "../../pages/estadisticas/alumnos_nuevos.jsx";
import VencimientosPage from "../../pages/estadisticas/vencimientos_proximos.jsx";
import HeatmapAsistenciasPage from "../../pages/estadisticas/heatmap_asistencias.jsx";
import RecaudacionesDetallePage from "../../pages/estadisticas/recaudacion_detalle_dia_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const estadisticasRoutes = [
  {
    path: "/estadisticas/recaudaciones-mensual",
    element: protegida(<RecaudacionCalendario />, ["admin"]),
  },
  {
    path: "/estadisticas/recaudaciones/:anio/:mes",
    element: protegida(<RecaudacionCalendarioDia />),
  },
  {
    path: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle",
    element: protegida(<RecaudacionesDetallePage />, ["admin"]),
  },
  {
    path: "/admin/estadisticas/alumnos-nuevos",
    element: protegida(<AlumnosNuevosPage />, ["admin"]),
  },
  {
    path: "/admin/estadisticas/vencimientos",
    element: protegida(<VencimientosPage />, ["admin"]),
  },
  {
    path: "/admin/estadisticas/heatmap",
    element: protegida(<HeatmapAsistenciasPage />, ["admin"]),
  },
];
