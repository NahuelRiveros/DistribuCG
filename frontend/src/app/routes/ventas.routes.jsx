import VentasPage from "../../pages/ventas/ventas_page.jsx";
import { protegida } from "./route_helpers.jsx";

export const ventasRoutes = [
  {
    path: "/admin/ventas",
    element: protegida(<VentasPage />, ["admin", "staff", "kinesiologo"]),
  },
];
