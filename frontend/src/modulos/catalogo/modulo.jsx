import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { FileSpreadsheet, FolderTree, Package, Store } from "lucide-react";
import { ROLES_PANEL } from "compartido/reglas/roles.js";
import { cliente, nombreProductos } from "@/clientes/index.js";
import MenuCategorias from "./tienda/menu_categorias.jsx";

// Todo lo que el módulo catálogo aporta a la app. Las pantallas se cargan recién
// cuando se visitan (lazy), así la tienda no descarga el código del panel.
const cargar = (importar) => async () => ({ Component: (await importar()).default });

export const moduloCatalogo = {
  codigo: "catalogo",

  // Navbar de la tienda: según clientes/<id>/navbar.js, un link "Productos" o el menú por categorías,
  // más "Novedades" y "Ofertas" si están activados.
  navbar: [
    cliente.navbar.menu_productos === "categorias" ? { clave: "menu-categorias", Componente: MenuCategorias } : { etiqueta: nombreProductos, a: "/catalogo" },
    ...(cliente.navbar.novedades ? [{ etiqueta: "Novedades", a: "/catalogo?orden=reciente" }] : []),
    ...(cliente.navbar.ofertas ? [{ etiqueta: "Ofertas", a: "/catalogo?oferta=1" }] : []),
  ],

  rutasPublicas: [
    { path: "catalogo", lazy: cargar(() => import("./tienda/catalogo_page.jsx")) },
    { path: "catalogo/:slug", lazy: cargar(() => import("./tienda/producto_detalle_page.jsx")) },
  ],

  // Rutas dentro de /admin
  rutasAdmin: [
    { path: "catalogo", element: <Navigate to="productos" replace /> },
    { path: "catalogo/productos", lazy: cargar(() => import("./admin/productos_page.jsx")) },
    { path: "catalogo/productos/nuevo", lazy: cargar(() => import("./admin/producto_form_page.jsx")) },
    { path: "catalogo/productos/:id", lazy: cargar(() => import("./admin/producto_form_page.jsx")) },
    { path: "catalogo/categorias", lazy: cargar(() => import("./admin/categorias_page.jsx")) },
    { path: "catalogo/importar", lazy: cargar(() => import("./admin/importacion/importacion_page.jsx")) },
  ],

  // Sección del menú lateral del panel
  menuAdmin: {
    titulo: "Catálogo",
    icono: Store,
    roles: ROLES_PANEL,
    items: [
      { etiqueta: "Productos", a: "/admin/catalogo/productos", icono: Package },
      { etiqueta: "Categorías", a: "/admin/catalogo/categorias", icono: FolderTree },
      { etiqueta: "Importar Excel", a: "/admin/catalogo/importar", icono: FileSpreadsheet },
    ],
  },

  // Tarjetas en el inicio del panel
  resumenAdmin: lazy(() => import("./admin/resumen_catalogo.jsx")),
};
