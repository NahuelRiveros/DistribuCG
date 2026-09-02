import ListaPacientesKinesiologiaPage from "../../modules/kinesiologia/lista_pacientes_page.jsx";
import FichaPacientePage from "../../modules/kinesiologia/ficha_paciente_page.jsx";
import PatologiasPage from "../../modules/kinesiologia/patologias_page.jsx";
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
