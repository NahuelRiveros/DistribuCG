import CatalogoDistribuidoraPage from "../../modules/eccomerce_distribuidora/catalogo/catalogo_page.jsx";
import ProductoDetalleDistribuidoraPage from "../../modules/eccomerce_distribuidora/catalogo/producto_detalle_page.jsx";
import NotaPedidoPage from "../../modules/eccomerce_distribuidora/carrito/nota_pedido_page.jsx";
import MisPedidosPage from "../../modules/eccomerce_distribuidora/carrito/mis_pedidos_page.jsx";
import CategoriasDistribuidoraPage from "../../modules/eccomerce_distribuidora/admin/categorias_page.jsx";
import ProductosDistribuidoraPage from "../../modules/eccomerce_distribuidora/admin/productos_page.jsx";
import NotasPedidoDistribuidoraPage from "../../modules/eccomerce_distribuidora/admin/notas_pedido_page.jsx";
import { protegida } from "./route_helpers.jsx";

// Rutas del módulo opcional eccomerce_distribuidora (ver módulo hermano
// eccomerce_indumentaria para el mismo patrón). Catálogo y carrito son solo
// para logueados (cliente/admin/staff) — decisión de negocio, no hay
// navegación pública acá. La visibilidad real se controla con
// modulo: "eccomerce_distribuidora" en navbar_config/eccomerce_distribuidora_dropdown.js
// + el toggle de /super-admin/modulos, no acá.
const ROLES_CLIENTE = ["cliente", "admin", "staff"];
const ROLES_ADMIN = ["admin", "staff"];
// Ver/procesar pedidos es un rol acotado aparte de "staff" — separa a
// propósito quien gestiona catálogo de quien gestiona ventas/pedidos.
const ROLES_VENTAS = ["admin", "vendedor"];

export const eccomerceDistribuidoraRoutes = [
  { path: "/distribuidora/catalogo", element: protegida(<CatalogoDistribuidoraPage />, ROLES_CLIENTE) },
  { path: "/distribuidora/catalogo/:id", element: protegida(<ProductoDetalleDistribuidoraPage />, ROLES_CLIENTE) },
  { path: "/distribuidora/carrito", element: protegida(<NotaPedidoPage />, ROLES_CLIENTE) },
  { path: "/distribuidora/mis-pedidos", element: protegida(<MisPedidosPage />, ROLES_CLIENTE) },

  { path: "/distribuidora/admin/categorias", element: protegida(<CategoriasDistribuidoraPage />, ROLES_ADMIN) },
  { path: "/distribuidora/admin/productos", element: protegida(<ProductosDistribuidoraPage />, ROLES_ADMIN) },
  { path: "/distribuidora/admin/notas-pedido", element: protegida(<NotasPedidoDistribuidoraPage />, ROLES_VENTAS) },
];
