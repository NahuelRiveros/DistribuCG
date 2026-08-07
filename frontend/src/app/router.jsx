import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/app_layout.jsx";
import ProtectedRoute from "../components/protected_route.jsx";


import HomePage from "../components/home/home_page.jsx";
import KioskPage from "../pages/kiosk_page.jsx";
import LoginPage from "../pages/login_page.jsx";
import RegisterAlumnoPage from "../pages/register_page.jsx";
import RecaudacionCalendario from "../pages/estadisticas/recaudacion_mensual_page.jsx";
import RecaudacionCalendarioDia from "../pages/estadisticas/recaudacion_diaria_page.jsx";
import AlumnosNuevosPage from "../pages/estadisticas/alumnos_nuevos.jsx";
import VencimientosPage from "../pages/estadisticas/vencimientos_proximos.jsx";
import HeatmapAsistenciasPage from "../pages/estadisticas/heatmap_asistencias.jsx"
import ListaAlumnosPage from "../pages/alumnos/lista_alumnos.jsx";
import DetalleAlumnoPage from "../pages/alumnos/detalle_alumno.jsx";
import RegistrarPagoPage from "../pages/registrar_pago.jsx";
import PlanesPage from "../pages/admin/planes_page.jsx";
import StaffPage from "../pages/admin/staff_page.jsx";
import RecaudacionesDetallePage from "../pages/estadisticas/recaudacion_detalle_dia_page.jsx";
import EditarPlanVigentePage from "../pages/admin/editar_plan_vigente_page.jsx";
import ConsultaPlanPage from "../pages/consulta_plan_page.jsx";
import SuscripcionPage from "../pages/admin/suscripcion_page.jsx";
import PagoExitosoPage from "../pages/pago_exitoso_page.jsx";
import PagoFallidoPage from "../pages/pago_fallido_page.jsx";
import PromocionesPage from "../pages/admin/promociones_page.jsx";
import GestionSuscripcionPage from "../pages/super_admin/gestion_suscripcion_page.jsx";
import GestionModulosPage from "../pages/super_admin/gestion_modulos_page.jsx";
import AudioConfigPage from "../pages/admin/audio_config_page.jsx";
import VentasPage from "../pages/ventas/ventas_page.jsx";
import HomeConfigPage from "../pages/admin/home_config_page.jsx";
import ListaPacientesKinesiologiaPage from "../pages/admin/kinesiologia/lista_pacientes_page.jsx";
import FichaPacientePage from "../pages/admin/kinesiologia/ficha_paciente_page.jsx";
import RegistrarSesionKinesiologiaPage from "../pages/admin/kinesiologia/registrar_sesion_page.jsx";
import PatologiasPage from "../pages/admin/kinesiologia/patologias_page.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <HomePage />
      </AppLayout>
    ),
  },
  {
    path: "*",
    element: (
      <AppLayout>
        <HomePage />
      </AppLayout>
    ),
  },
  {
    path: "/kiosk",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
          <KioskPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/login",
    element: (
      <AppLayout>
        <LoginPage />
      </AppLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
          <RegisterAlumnoPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },

  //ESTADISTICAS
  {
    path: "/estadisticas/recaudaciones-mensual",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <RecaudacionCalendario />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/estadisticas/recaudaciones/:anio/:mes",
    element: (
      <AppLayout>
        <ProtectedRoute>
          <RecaudacionCalendarioDia />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
    {
    path: "/admin/estadisticas/alumnos-nuevos",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <AlumnosNuevosPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/admin/estadisticas/vencimientos",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <VencimientosPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/admin/estadisticas/heatmap",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <HeatmapAsistenciasPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
  path: "/admin/estadisticas/alumnos",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
        <ListaAlumnosPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
    path: "/admin/estadisticas/alumnos/:id",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
          <DetalleAlumnoPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
  path: "/admin/pagos/registrar",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
        <RegistrarPagoPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/planesViews",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <PlanesPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/staffManager",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <StaffPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <RecaudacionesDetallePage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/alumnos/editar-plan",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <EditarPlanVigentePage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/consulta-plan",
  element: (
    <AppLayout>
      <ConsultaPlanPage />
    </AppLayout>
  ),
},
{
  path: "/admin/suscripcion",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <SuscripcionPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/promociones",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <PromocionesPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/config-audio",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
        <AudioConfigPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/ventas",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "staff", "kinesiologo"]}>
        <VentasPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/super-admin/suscripcion",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["super_admin"]}>
        <GestionSuscripcionPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/super-admin/modulos",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["super_admin"]}>
        <GestionModulosPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/home-config",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin"]}>
        <HomeConfigPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/kinesiologia",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "kinesiologo"]}>
        <ListaPacientesKinesiologiaPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/kinesiologia/patologias",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "kinesiologo"]}>
        <PatologiasPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/kinesiologia/:id",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "kinesiologo"]}>
        <FichaPacientePage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/admin/kinesiologia/:id/sesion",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "kinesiologo"]}>
        <RegistrarSesionKinesiologiaPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
  path: "/pago-exitoso",
  element: (
    <AppLayout>
      <PagoExitosoPage />
    </AppLayout>
  ),
},
{
  path: "/pago-fallido",
  element: (
    <AppLayout>
      <PagoFallidoPage />
    </AppLayout>
  ),
},
  
]);
