import { createBrowserRouter, Outlet } from "react-router-dom";
import AppLayout from "../components/layout/app_layout.jsx";

import { generalRoutes } from "./routes/general.routes.jsx";
import { estadisticasRoutes } from "./routes/estadisticas.routes.jsx";
import { alumnosRoutes } from "./routes/alumnos.routes.jsx";
import { adminRoutes } from "./routes/admin.routes.jsx";
import { kinesiologiaRoutes } from "./routes/kinesiologia.routes.jsx";
import { ventasRoutes } from "./routes/ventas.routes.jsx";
import { superAdminRoutes } from "./routes/super_admin.routes.jsx";

export const router = createBrowserRouter([
  {
    element: (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
    children: [
      ...generalRoutes,
      ...estadisticasRoutes,
      ...alumnosRoutes,
      ...adminRoutes,
      ...kinesiologiaRoutes,
      ...ventasRoutes,
      ...superAdminRoutes,
    ],
  },
]);
