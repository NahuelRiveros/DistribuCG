import CartPage from "../../modules/eccomerce_indumentaria/carrito/cart_page.jsx";
import AdminCatalogsPage from "../../modules/eccomerce_indumentaria/catalogos/admin_catalogs_page.jsx";
import AdminStockAlertsPage from "../../modules/eccomerce_indumentaria/productos/admin_stock_alerts_page.jsx";
import { protegida } from "./route_helpers.jsx";

// Rutas del módulo opcional eccomerce_indumentaria (ver
// src/modules/eccomerce_indumentaria/CHANGELOG.md).
// Igual que gym/kinesiología en su momento: las rutas quedan siempre
// registradas, la visibilidad en el navbar es lo que se apaga por config/rol.
export const eccomerceIndumentariaRoutes = [
  { path: "/carrito", element: protegida(<CartPage />) },
  { path: "/admin/catalogos", element: protegida(<AdminCatalogsPage />, ["admin"]) },
  { path: "/admin/productos/stock-bajo", element: protegida(<AdminStockAlertsPage />, ["admin"]) },
];
