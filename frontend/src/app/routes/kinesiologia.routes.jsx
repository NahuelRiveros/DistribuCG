import ListaPacientesKinesiologiaPage from "../../pages/admin/kinesiologia/lista_pacientes_page.jsx";
import FichaPacientePage from "../../pages/admin/kinesiologia/ficha_paciente_page.jsx";
import PatologiasPage from "../../pages/admin/kinesiologia/patologias_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const kinesiologiaRoutes = [
  {
    path: "/admin/kinesiologia",
    element: protegida(<ListaPacientesKinesiologiaPage />, ["admin", "kinesiologo"]),
  },
  {
    path: "/admin/kinesiologia/patologias",
    element: protegida(<PatologiasPage />, ["admin", "kinesiologo"]),
  },
  {
    path: "/admin/kinesiologia/:id",
    element: protegida(<FichaPacientePage />, ["admin", "kinesiologo"]),
  },
];
