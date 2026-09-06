import { Navigate } from "react-router-dom";
import ProductosDistribuidoraPage from "../../modules/eccomerce_distribuidora/productos/productos_page.jsx";
import ProductoDetalleDistribuidoraPage from "../../modules/eccomerce_distribuidora/productos/producto_detalle_page.jsx";
import NotaPedidoPage from "../../modules/eccomerce_distribuidora/carrito/nota_pedido_page.jsx";
import MisPedidosPage from "../../modules/eccomerce_distribuidora/carrito/mis_pedidos_page.jsx";
import PerfilPage from "../../modules/eccomerce_distribuidora/perfil/perfil_page.jsx";
// Aliaseado para no chocar con ProductosDistribuidoraPage (arriba) — son dos
// componentes con el mismo nombre por default export en archivos distintos
// (catálogo del cliente vs. árbol de categorías/productos del admin), nada
// raro, solo hace falta un alias acá donde conviven en el mismo import.
import AdminProductosPage from "../../modules/eccomerce_distribuidora/admin/productos_page.jsx";
import NotasPedidoDistribuidoraPage from "../../modules/eccomerce_distribuidora/pedidos/notas_pedido_page.jsx";
import ImportacionDistribuidoraPage from "../../modules/eccomerce_distribuidora/admin/importacion_page.jsx";
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
  { path: "/distribuidora/catalogo", element: protegida(<ProductosDistribuidoraPage />, ROLES_CLIENTE) },
  { path: "/distribuidora/catalogo/:id", element: protegida(<ProductoDetalleDistribuidoraPage />, ROLES_CLIENTE) },
  { path: "/distribuidora/carrito", element: protegida(<NotaPedidoPage />, ROLES_CLIENTE) },
  { path: "/distribuidora/mis-pedidos", element: protegida(<MisPedidosPage />, ROLES_CLIENTE) },

  // Sin restricción de rol — el backend (perfil_cliente_router.js) tampoco
  // la tiene, es siempre "mi propio perfil" (req.user.usuario_id). El link
  // "Mi perfil" del navbar (navbar_userbox.jsx) apunta acá para CUALQUIER
  // usuario logueado, no solo clientes — un admin/staff que hace su propio
  // pedido también necesita completar estos datos.
  { path: "/perfil", element: protegida(<PerfilPage />) },

  // Categorías se unificó dentro de Productos (mismo árbol, categorías y
  // productos se gestionan desde un solo lugar) — se deja el redirect por si
  // alguien tiene el link viejo guardado.
  { path: "/distribuidora/admin/categorias", element: <Navigate to="/distribuidora/admin/productos" replace /> },
  { path: "/distribuidora/admin/productos", element: protegida(<AdminProductosPage />, ROLES_ADMIN) },
  { path: "/distribuidora/admin/importar", element: protegida(<ImportacionDistribuidoraPage />, ROLES_ADMIN) },
  { path: "/distribuidora/admin/notas-pedido", element: protegida(<NotasPedidoDistribuidoraPage />, ROLES_VENTAS) },
];
