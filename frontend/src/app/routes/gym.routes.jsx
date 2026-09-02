import KioskPage from "../../modules/gym/kiosk_page.jsx";
import ConsultaPlanPage from "../../modules/gym/consulta_plan_page.jsx";
import PagoExitosoPage from "../../modules/gym/pago_exitoso_page.jsx";
import PagoFallidoPage from "../../modules/gym/pago_fallido_page.jsx";
import RegistrarPagoPage from "../../modules/gym/registrar_pago.jsx";
import ListaAlumnosPage from "../../modules/gym/alumnos/lista_alumnos.jsx";
import DetalleAlumnoPage from "../../modules/gym/alumnos/detalle_alumno.jsx";
import AlumnosNuevosPage from "../../modules/gym/estadisticas/alumnos_nuevos.jsx";
import HeatmapAsistenciasPage from "../../modules/gym/estadisticas/heatmap_asistencias.jsx";
import VencimientosPage from "../../modules/gym/estadisticas/vencimientos_proximos.jsx";
import RecaudacionMensualPage from "../../modules/gym/estadisticas/recaudacion_mensual_page.jsx";
import RecaudacionDiariaPage from "../../modules/gym/estadisticas/recaudacion_diaria_page.jsx";
import RecaudacionDetalleDiaPage from "../../modules/gym/estadisticas/recaudacion_detalle_dia_page.jsx";
import PlanesPage from "../../modules/gym/planes_page.jsx";
import PromocionesPage from "../../modules/gym/promociones_page.jsx";
import EditarPlanVigentePage from "../../modules/gym/editar_plan_vigente_page.jsx";
import VentasPage from "../../modules/gym/ventas/ventas_page.jsx";
import { protegida } from "./route_helpers.jsx";

// Rutas del módulo opcional gym (ver módulo hermano eccomerce_indumentaria
// para el mismo patrón). La visibilidad real se controla con modulo: "gym" en
// navbar_config/gym_dropdown.js + el toggle de /super-admin/modulos, no acá.
export const gymRoutes = [
  { path: "/kiosk", element: protegida(<KioskPage />, ["admin", "staff", "profesional"]) },
  { path: "/consulta-plan", element: <ConsultaPlanPage /> },
  { path: "/pago-exitoso", element: <PagoExitosoPage /> },
  { path: "/pago-fallido", element: <PagoFallidoPage /> },
  {
    path: "/admin/pagos/registrar",
    element: protegida(<RegistrarPagoPage />, ["admin", "staff", "profesional"]),
  },
  {
    path: "/admin/estadisticas/alumnos",
    element: protegida(<ListaAlumnosPage />, ["admin", "staff", "profesional"]),
  },
  {
    path: "/admin/estadisticas/alumnos/:id",
    element: protegida(<DetalleAlumnoPage />, ["admin", "staff", "profesional"]),
  },
  { path: "/admin/estadisticas/alumnos-nuevos", element: protegida(<AlumnosNuevosPage />, ["admin"]) },
  { path: "/admin/estadisticas/vencimientos", element: protegida(<VencimientosPage />, ["admin"]) },
  { path: "/admin/estadisticas/heatmap", element: protegida(<HeatmapAsistenciasPage />, ["admin"]) },
  { path: "/estadisticas/recaudaciones-mensual", element: protegida(<RecaudacionMensualPage />, ["admin"]) },
  { path: "/estadisticas/recaudaciones/:anio/:mes", element: protegida(<RecaudacionDiariaPage />) },
  {
    path: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle",
    element: protegida(<RecaudacionDetalleDiaPage />, ["admin"]),
  },
  { path: "/admin/planesViews", element: protegida(<PlanesPage />, ["admin"]) },
  { path: "/admin/promociones", element: protegida(<PromocionesPage />, ["admin"]) },
  {
    path: "/admin/alumnos/editar-plan",
    element: protegida(<EditarPlanVigentePage />, ["admin"]),
  },
  {
    path: "/admin/ventas",
    element: protegida(<VentasPage />, ["admin", "staff", "profesional"]),
  },
];
