import { lazy } from "react";
const ListaPacientesKinesiologiaPage = lazy(() => import("../../modules/kinesiologia/lista_pacientes_page.jsx"));
const FichaPacientePage = lazy(() => import("../../modules/kinesiologia/ficha_paciente_page.jsx"));
const PatologiasPage = lazy(() => import("../../modules/kinesiologia/patologias_page.jsx"));
import { protegida } from "./route_helpers.jsx";

export const kinesiologiaRoutes = [
  {
    path: "/admin/kinesiologia",
    element: protegida(<ListaPacientesKinesiologiaPage />, ["admin", "profesional"]),
  },
  {
    path: "/admin/kinesiologia/patologias",
    element: protegida(<PatologiasPage />, ["admin", "profesional"]),
  },
  {
    path: "/admin/kinesiologia/:id",
    element: protegida(<FichaPacientePage />, ["admin", "profesional"]),
  },
];
