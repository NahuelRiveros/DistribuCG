import { lazy } from "react";
import { storefrontConfig } from "./storefront_config.js";
const ProductosDistribuidoraPage = lazy(() => import("./productos/productos_page.jsx"));
const ProductoDetalleDistribuidoraPage = lazy(() => import("./productos/producto_detalle_page.jsx"));
const NotaPedidoPage = lazy(() => import("./carrito/nota_pedido_page.jsx"));
const MisPedidosPage = lazy(() => import("./carrito/mis_pedidos_page.jsx"));
const PerfilPage = lazy(() => import("./perfil/perfil_page.jsx"));
const CategoriasDistribuidoraPage = lazy(() => import("./admin/categorias_page.jsx"));
const ArticuloFormPage = lazy(() => import("./admin/articulo_form_page.jsx"));
const ListasPrecioPage = lazy(() => import("./admin/listas_precio_page.jsx"));
const ListaPrecioFormPage = lazy(() => import("./admin/lista_precio_form_page.jsx"));
const ListaPrecioPreciosPage = lazy(() => import("./admin/lista_precio_precios_page.jsx"));
const MarcaFormPage = lazy(() => import("./admin/marca_form_page.jsx"));
const MarcasDistribuidoraPage = lazy(() => import("./admin/marcas_page.jsx"));
const NotasPedidoDistribuidoraPage = lazy(() => import("./pedidos/notas_pedido_page.jsx"));
const ImportacionDistribuidoraPage = lazy(() => import("./admin/importacion_page.jsx"));
const ArticulosPage = lazy(() => import("./admin/articulos_page.jsx"));
const ListaCargaPage = lazy(() => import("./pedidos/lista_carga_page.jsx"));
const ClientesPage = lazy(() => import("./admin/clientes_page.jsx"));
import { protegida } from "../../core/app/routes/route_helpers.jsx";

// Catálogo público y carrito invitado configurables por instalación. Cualquier
// usuario con sesión puede comprar; la gestión pide permisos (permisos_config.js),
// que el servidor vuelve a verificar en cada acción.
const CATALOGO = { permisos: ["productos.editar"] };
const PRECIOS = { permisos: ["precios.editar"] };
const PEDIDOS = { permisos: ["pedidos.ver"] };
const CLIENTES = { permisos: ["clientes.ver"] };
// La importación escribe artículos y precios: necesita los dos permisos.
const IMPORTAR = { permisos: ["productos.editar", "precios.editar"], todos: true };

export const eccomerceDistribuidoraRoutes = [
  { path: "/distribuidora/catalogo", element: storefrontConfig.publicCatalog ? <ProductosDistribuidoraPage /> : protegida(<ProductosDistribuidoraPage />) },
  { path: "/distribuidora/catalogo/:id", element: storefrontConfig.publicCatalog ? <ProductoDetalleDistribuidoraPage /> : protegida(<ProductoDetalleDistribuidoraPage />) },
  { path: "/distribuidora/carrito", element: storefrontConfig.guestCart && storefrontConfig.publicCatalog ? <NotaPedidoPage /> : protegida(<NotaPedidoPage />) },
  { path: "/distribuidora/mis-pedidos", element: protegida(<MisPedidosPage />) },

  // Sin restricción de rol — el backend (perfil_cliente_router.js) tampoco
  // la tiene, es siempre "mi propio perfil" (req.user.usuario_id). El link
  // "Mi perfil" del navbar (navbar_userbox.jsx) apunta acá para CUALQUIER
  // usuario logueado, no solo clientes — alguien del equipo que hace su propio
  // pedido también necesita completar estos datos.
  { path: "/perfil", element: protegida(<PerfilPage />) },
];

// Pantallas de gestión: se muestran dentro del panel (ver panel.routes.jsx), con las mismas direcciones.
export const eccomerceDistribuidoraAdminRoutes = [
  // "Artículos" (tabla con filtros) y "Familias y categorías" (árbol con sus artículos).
  { path: "/distribuidora/admin/productos", element: protegida(<ArticulosPage />, CATALOGO) },
  // Ficha del artículo en página propia, bajo "productos" para que el menú siga marcando Artículos.
  { path: "/distribuidora/admin/productos/nuevo", element: protegida(<ArticuloFormPage />, CATALOGO) },
  { path: "/distribuidora/admin/productos/:id", element: protegida(<ArticuloFormPage />, CATALOGO) },
  { path: "/distribuidora/admin/categorias", element: protegida(<CategoriasDistribuidoraPage />, CATALOGO) },
  { path: "/distribuidora/admin/marcas", element: protegida(<MarcasDistribuidoraPage />, CATALOGO) },
  { path: "/distribuidora/admin/marcas/nueva", element: protegida(<MarcaFormPage />, CATALOGO) },
  { path: "/distribuidora/admin/marcas/:id", element: protegida(<MarcaFormPage />, CATALOGO) },
  // Listas de precios regionales: quien puede cambiar precios, igual que en el servidor.
  { path: "/distribuidora/admin/listas-precio", element: protegida(<ListasPrecioPage />, PRECIOS) },
  { path: "/distribuidora/admin/listas-precio/nueva", element: protegida(<ListaPrecioFormPage />, PRECIOS) },
  { path: "/distribuidora/admin/listas-precio/:id", element: protegida(<ListaPrecioFormPage />, PRECIOS) },
  { path: "/distribuidora/admin/listas-precio/:id/precios", element: protegida(<ListaPrecioPreciosPage />, PRECIOS) },
  { path: "/distribuidora/admin/lista-carga", element: protegida(<ListaCargaPage />, PEDIDOS) },
  { path: "/distribuidora/admin/importar", element: protegida(<ImportacionDistribuidoraPage />, IMPORTAR) },
  { path: "/distribuidora/admin/notas-pedido", element: protegida(<NotasPedidoDistribuidoraPage />, PEDIDOS) },
  { path: "/distribuidora/admin/clientes", element: protegida(<ClientesPage />, CLIENTES) },
];
