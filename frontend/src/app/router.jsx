import { Suspense } from "react";
import { projectModules } from "../config/gate_config.js";
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
        <Suspense fallback={<p role="status" className="p-8 text-center">Cargando…</p>}><Outlet /></Suspense>
      </AppLayout>
    ),
    children: [
      ...generalRoutes,
      ...adminRoutes,
      ...superAdminRoutes,
      ...(projectModules.eccomerce_indumentaria ? eccomerceIndumentariaRoutes : []),
      ...eccomerceDistribuidoraRoutes,
      ...(projectModules.gym ? gymRoutes : []),
      ...(projectModules.kinesiologia ? kinesiologiaRoutes : []),
    ],
  },
]);
