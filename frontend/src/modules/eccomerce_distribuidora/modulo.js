import { Boxes, ClipboardList, HelpCircle, Package, Phone, ShoppingCart, UserCircle } from "lucide-react";
import { storefrontConfig } from "./storefront_config.js";
import { eccomerceDistribuidoraCatalogoLink, eccomerceDistribuidoraAdminDropdown } from "./menu.js";

// Lo que el core (menús, footer, panel, login) necesita saber de este módulo. Solo
// datos, sin pantallas: también lo leen los tests de Node (ver modulo_pantallas.jsx).
export const moduloDistribuidora = {
  codigo: "eccomerce_distribuidora",
  icono: Boxes, // en "Módulos habilitados" del super admin

  menu: {
    links: [
      eccomerceDistribuidoraCatalogoLink,
      { label: "Cómo pedir", to: "/#como-pedir", icon: HelpCircle },
      { label: "Contacto", to: "/#contacto", icon: Phone },
    ],
    cuenta: [
      { label: "Mis pedidos", to: storefrontConfig.ordersPath, requiereAuth: true, modulo: "eccomerce_distribuidora", icon: ClipboardList },
      { label: "Mis datos", to: storefrontConfig.profilePath, requiereAuth: true, modulo: "eccomerce_distribuidora", icon: UserCircle },
    ],
    panel: [{ id: "distribuidora", titulo: "Distribuidora", items: eccomerceDistribuidoraAdminDropdown.items }],
  },

  // Un módulo con tienda decide el destino después del login, el llamado del home y del footer.
  tienda: {
    catalogo: storefrontConfig.catalogPath,
    aviso: storefrontConfig.labels.orderNotice,
    textoLogin: "Ingresá para enviar y consultar tus pedidos.",
    linksFooter: [
      { label: "Catálogo", to: storefrontConfig.catalogPath, icon: Package },
      { label: "Cómo pedir", to: "/#como-pedir", icon: HelpCircle },
      { label: "Mi carrito", to: storefrontConfig.cartPath, icon: ShoppingCart },
      { label: "Mis pedidos", to: storefrontConfig.ordersPath, icon: ClipboardList },
      { label: "Mi perfil", to: storefrontConfig.profilePath, icon: UserCircle },
    ],
  },
};
