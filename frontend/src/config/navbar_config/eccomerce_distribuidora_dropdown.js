import { ShoppingBag, LayoutGrid, Package, ClipboardList, FolderTree } from "lucide-react";

// Dropdown de primer nivel — igual forma que gymDropdown/kinesiologiaDropdown
// en sus archivos hermanos. El gate maestro (projectModules.eccomerce_distribuidora,
// de gate_config.js) se aplica en main.js, no acá.
export const eccomerceDistribuidoraDropdown = {
  id: "eccomerce_distribuidora",
  labelNoAuth: "Distribuidora",
  labelAuth: "Distribuidora",
  icon: ShoppingBag,
  items: [
    {
      label: "Catálogo",
      to: "/distribuidora/catalogo",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      roles: ["cliente", "admin", "staff"],
      icon: LayoutGrid,
    },
    {
      label: "Mi pedido",
      to: "/distribuidora/carrito",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      roles: ["cliente", "admin", "staff"],
      icon: ShoppingBag,
    },
    {
      label: "Mis pedidos",
      to: "/distribuidora/mis-pedidos",
      requiereAuth: true,
      modulo: "eccomerce_distribuidora",
      roles: ["cliente", "admin", "staff"],
      icon: ClipboardList,
    },
    {
      // Grupo — administración del catálogo (admin/staff) y de los pedidos
      // recibidos (admin/vendedor, rol acotado aparte). El roles de acá
      // arriba es la UNIÓN de ambos, para que el grupo se muestre si el
      // usuario puede ver AL MENOS un hijo — cada hijo filtra el suyo.
      label: "Administrar",
      icon: Package,
      requiereAuth: true,
      roles: ["admin", "staff", "vendedor"],
      children: [
        { label: "Categorías", to: "/distribuidora/admin/categorias", requiereAuth: true, modulo: "eccomerce_distribuidora", roles: ["admin", "staff"], icon: FolderTree },
        { label: "Productos",  to: "/distribuidora/admin/productos",  requiereAuth: true, modulo: "eccomerce_distribuidora", roles: ["admin", "staff"], icon: Package },
        { label: "Notas de pedido", to: "/distribuidora/admin/notas-pedido", requiereAuth: true, modulo: "eccomerce_distribuidora", roles: ["admin", "vendedor"], icon: ClipboardList },
      ],
    },
  ],
};
