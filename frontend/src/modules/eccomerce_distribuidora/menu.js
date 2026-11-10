import { storefrontConfig } from "./storefront_config.js";
import {
  LayoutGrid,
  Package,
  ClipboardList,
  Upload,
  Boxes,
  FolderTree,
  Tag,
  Tags,
  Truck,
  Users,
} from "lucide-react";

// Menús del módulo, mismas reglas que adminDropdown. Los usa modulo.js; el gate
// maestro (gate_config.js) se aplica en modules/modulos_activos.js, no acá.
//   - eccomerceDistribuidoraCatalogoLink ("Productos"): link directo al catálogo.
//   - eccomerceDistribuidoraAdminDropdown ("Distribuidora · Gestión"): equipo
//     gestionando catálogo y pedidos recibidos (grupo del panel).

// "Productos" — link directo al catálogo (mismo filtro roles/modulo que
// un ítem de dropdown, ver navbar_permissions.js: aplica igual a `links`).
export const eccomerceDistribuidoraCatalogoLink = {
  label: "Productos",
  to: "/distribuidora/catalogo",
  requiereAuth: !storefrontConfig.publicCatalog,
  modulo: "eccomerce_distribuidora",
  // Cualquier usuario con sesión compra; sin catálogo público, alcanza con requiereAuth.
  icon: LayoutGrid,
};

// "Distribuidora · Gestión" — catálogo, precios y pedidos recibidos. Cada ítem
// pide su permiso (permisos_config.js); el grupo se muestra si queda alguno.
export const eccomerceDistribuidoraAdminDropdown = {
  id: "eccomerce_distribuidora_admin",
  labelNoAuth: "Distribuidora · Gestión",
  labelAuth: "Distribuidora · Gestión",
  icon: Boxes,
  items: [
    {
      label: "Artículos",
      to: "/distribuidora/admin/productos",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["productos.editar"],
      icon: Package,
    },
    {
      label: "Familias y categorías",
      to: "/distribuidora/admin/categorias",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["productos.editar"],
      icon: FolderTree,
    },
    {
      label: "Marcas",
      to: "/distribuidora/admin/marcas",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["productos.editar"],
      icon: Tag,
    },
    {
      label: "Listas de precios",
      to: "/distribuidora/admin/listas-precio",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["precios.editar"],
      icon: Tags,
    },
    {
      label: "Importar productos",
      to: "/distribuidora/admin/importar",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["productos.editar", "precios.editar"],
      todosLosPermisos: true,
      icon: Upload,
    },
    {
      label: "Notas de pedido",
      to: "/distribuidora/admin/notas-pedido",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["pedidos.ver"],
      icon: ClipboardList,
    },
    {
      // "Artículos a cargar": varios pedidos juntos, por familia, en bultos y sueltos.
      label: "Lista de carga",
      to: "/distribuidora/admin/lista-carga",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["pedidos.ver"],
      icon: Truck,
    },
    {
      // CLI-11: datos de contacto, facturación y entrega; permiso propio por ser datos personales.
      label: "Clientes",
      to: "/distribuidora/admin/clientes",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      permisos: ["clientes.ver"],
      icon: Users,
    },
  ],
};
