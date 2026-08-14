import HomePage from "../../components/home/home_page.jsx";
import KioskPage from "../../pages/kiosk_page.jsx";
import LoginPage from "../../pages/login_page.jsx";
import RegisterAlumnoPage from "../../pages/register_page.jsx";
import RegistrarPagoPage from "../../pages/registrar_pago.jsx";
import ConsultaPlanPage from "../../pages/consulta_plan_page.jsx";
import PagoExitosoPage from "../../pages/pago_exitoso_page.jsx";
import PagoFallidoPage from "../../pages/pago_fallido_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const generalRoutes = [
  { path: "/", element: <HomePage /> },
  { path: "*", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/consulta-plan", element: <ConsultaPlanPage /> },
  { path: "/pago-exitoso", element: <PagoExitosoPage /> },
  { path: "/pago-fallido", element: <PagoFallidoPage /> },
  {
    path: "/kiosk",
    element: protegida(<KioskPage />, ["admin", "staff", "kinesiologo"]),
  },
  {
    path: "/register",
    element: protegida(<RegisterAlumnoPage />, ["admin", "staff", "kinesiologo"]),
  },
  {
    path: "/admin/pagos/registrar",
    element: protegida(<RegistrarPagoPage />, ["admin", "staff", "kinesiologo"]),
  },
];
