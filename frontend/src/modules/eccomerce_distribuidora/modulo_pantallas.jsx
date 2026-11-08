import { lazy } from "react";
import { eccomerceDistribuidoraRoutes, eccomerceDistribuidoraAdminRoutes } from "./rutas.jsx";
import { CarritoDistribuidoraProvider } from "./carrito/carrito_context.jsx";
import CarritoDistribuidoraIcon from "./carrito/carrito_icon.jsx";

// Pantallas y componentes que el core monta para este módulo (ver modules/pantallas_modulos.jsx).
// Diferidos para no sumarlos al bundle inicial: el core los envuelve en Suspense.
export const pantallasDistribuidora = {
  codigo: "eccomerce_distribuidora",
  rutasTienda: eccomerceDistribuidoraRoutes,
  rutasPanel: eccomerceDistribuidoraAdminRoutes,
  Proveedor: CarritoDistribuidoraProvider,
  extrasNavbar: [CarritoDistribuidoraIcon],
  ResumenPanel: lazy(() => import("./panel/resumen_distribuidora.jsx")),
  InicioTienda: lazy(() => import("./home/home_tienda.jsx")),
};
