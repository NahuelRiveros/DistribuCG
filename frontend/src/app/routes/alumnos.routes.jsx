import ListaAlumnosPage from "../../pages/alumnos/lista_alumnos.jsx";
import DetalleAlumnoPage from "../../pages/alumnos/detalle_alumno.jsx";
import { protegida } from "./route_helpers.jsx";

export const alumnosRoutes = [
  {
    path: "/admin/estadisticas/alumnos",
    element: protegida(<ListaAlumnosPage />, ["admin", "staff", "kinesiologo"]),
  },
  {
    path: "/admin/estadisticas/alumnos/:id",
    element: protegida(<DetalleAlumnoPage />, ["admin", "staff", "kinesiologo"]),
  },
];
