import { createBrowserRouter } from "react-router-dom";
import { ROLES_PANEL } from "compartido/reglas/roles.js";
import AppLayout from "@/componentes/layout/app_layout.jsx";
import AdminLayout from "@/componentes/admin/admin_layout.jsx";
import RutaProtegida from "@/componentes/acceso/ruta_protegida.jsx";
import HomePage from "@/modulos/home/home_page.jsx";
import { proyecto } from "compartido/proyecto.js";
import { modulosActivos } from "@/modulos/registro.js";
import ErrorPage from "./error_page.jsx";
import NoEncontradoPage from "./no_encontrado_page.jsx";
import Raiz from "./raiz.jsx";

// Las rutas de cada módulo activo vienen de modulos/registro.js.
// Cada zona envuelve sus pantallas en una ruta sin path con errorElement: si una pantalla falla,
// el error se muestra en su lugar y el navbar / menú del panel siguen andando.
const rutasPublicas = modulosActivos.flatMap((m) => m.rutasPublicas ?? []);
const rutasAdmin = modulosActivos.flatMap((m) => m.rutasAdmin ?? []);

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    errorElement: <ErrorPage />,
    children: [
      {
        // Tienda: navbar y footer del cliente
        path: "/",
        element: <AppLayout />,
        children: [
          {
            errorElement: <ErrorPage />,
            children: [
              { index: true, element: <HomePage /> },
              // Bajo demanda: el login trae las librerías de formularios, que el que solo mira productos no necesita.
              { path: "login", lazy: async () => ({ Component: (await import("@/modulos/usuarios/login_page.jsx")).default }) },
              ...(proyecto.usuarios.registro_publico ? [{ path: "registro", lazy: async () => ({ Component: (await import("@/modulos/usuarios/registro_page.jsx")).default }) }] : []),
              ...rutasPublicas,
              { path: "*", element: <NoEncontradoPage /> },
            ],
          },
        ],
      },
      {
        // Panel de administración: diseño propio con menú lateral
        path: "/admin",
        element: (
          <RutaProtegida roles={ROLES_PANEL}>
            <AdminLayout />
          </RutaProtegida>
        ),
        children: [
          {
            errorElement: <ErrorPage />,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/componentes/admin/panel_inicio_page.jsx")).default }),
              },
              ...rutasAdmin,
              { path: "*", element: <NoEncontradoPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
