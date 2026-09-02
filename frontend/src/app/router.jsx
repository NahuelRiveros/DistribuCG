import { createBrowserRouter, Outlet } from "react-router-dom";
import AppLayout from "../controls/layout/app_layout.jsx";

import { generalRoutes } from "./routes/general.routes.jsx";
import { adminRoutes } from "./routes/admin.routes.jsx";
import { superAdminRoutes } from "./routes/super_admin.routes.jsx";
import { eccomerceIndumentariaRoutes } from "./routes/eccomerce_indumentaria.routes.jsx";
import { eccomerceDistribuidoraRoutes } from "./routes/eccomerce_distribuidora.routes.jsx";
import { gymRoutes } from "./routes/gym.routes.jsx";
import { kinesiologiaRoutes } from "./routes/kinesiologia.routes.jsx";

export const router = createBrowserRouter([
  {
    element: (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
    children: [
      ...generalRoutes,
      ...adminRoutes,
      ...superAdminRoutes,
      ...eccomerceIndumentariaRoutes,
      ...eccomerceDistribuidoraRoutes,
      ...gymRoutes,
      ...kinesiologiaRoutes,
    ],
  },
]);
