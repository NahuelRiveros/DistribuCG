import { Home } from "lucide-react";
import { accountLinks } from "./account.js";
import { brandConfig } from "../brand_config.js";
import { modulosActivos } from "../../modules/modulos_activos.js";
import { pantallasActivas } from "../../modules/pantallas_modulos.jsx";

import { panelGestionLink } from "./panel_gestion.js";

// Un archivo por dropdown (admin_dropdown.js,
// super_admin_dropdown.js) — cada uno dueño de todo su árbol, sin
// importarse cosas entre sí. Este archivo solo ensambla: agrega el import
// y una línea de spread en `dropdowns`, nunca copia ítems de otro archivo.
// Si un dropdown tiene sub-menús (como "Admin" → Gestión/Configuración),
// eso se resuelve con `children` DENTRO de ese mismo archivo, no partiendo
// el dropdown en más archivos — ver admin_dropdown.js.
//
// `extras` son componentes que se renderizan en la barra, junto al login/user
// box — así controls/layout/navbar.jsx no necesita importar directamente
// módulos opcionales (ej. carrito). Cada componente decide por su cuenta si
// se muestra o no.
//
// DOS GATES, uno arriba del otro:
//   1. gate_config.js (el gate maestro) decide si el módulo EXISTE en este
//      proyecto — por eso los grupos se arman condicionalmente acá con
//      spreads (...(projectModules.eccomerce_distribuidora ? [...] : [])). Si es
//      false, ni se define el ítem: no hay nada que un cliente pueda reactivar.
//   2. Dentro de un módulo ya habilitado en el código, cada ítem lleva
//      `modulo: "<codigo>"` y se filtra en vivo con moduloHabilitado() contra
//      la tabla modulo_negocio (togleable desde /super-admin/modulos, sin
//      redeploy). Así un super_admin puede apagar temporalmente un módulo y esos
//      ítems desaparecen aunque gate_config.js siga en true.
// Los ítems del propio dropdown "super_admin" (Suscripción, Módulos
// habilitados) NO llevan `modulo:` — tienen que seguir accesibles aunque
// todo lo demás esté apagado, para poder volver a prenderlo.
export const navbar_config = {
  extras: pantallasActivas.flatMap((pantallas) => pantallas.extrasNavbar ?? []),
  accountLinks,

  brand: {
    titulo: brandConfig.nombre,
    subtitulo: brandConfig.rubro,
    logoUrl: null,
    mostrarTitulo: true,
    mostrarSubtitulo: true,
    linkTo: "/",
  },

  labels: {
    menuAbrir: "Abrir menú",
    dropdownAbrir: "Abrir submenú",
    seccionDropdownMobile: "Administración",
    botonSalir: "Cerrar sesión",
  },

  links: [
    { label: "Inicio", to: "/", exact: true, icon: Home },
    ...modulosActivos.flatMap((modulo) => modulo.menu?.links ?? []),
    // "Distribuidora · Gestión", "Admin" y "Sistema" viven en el panel (/panel),
    // con su menú lateral; ver panel_gestion.js.
    panelGestionLink,
  ],

  dropdowns: [],
};
