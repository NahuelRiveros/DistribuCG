import { lazy } from "react";
import { Outlet } from "react-router-dom";
import { ClipboardList, ShoppingBag } from "lucide-react";
import { ROLES_PANEL } from "compartido/reglas/roles.js";
import RutaProtegida from "@/componentes/acceso/ruta_protegida.jsx";
import CarritoIcono from "./componentes/carrito_icono.jsx";
import AgregarAlPedido from "./componentes/agregar_al_pedido.jsx";
import SincronizarCarrito from "./componentes/sincronizar_carrito.jsx";

const cargar = (importar) => async () => ({ Component: (await importar()).default });

export const moduloTienda = {
  codigo: "tienda",

  // Componentes en el navbar de la tienda (a la derecha, junto a la cuenta)
  navbarExtras: [CarritoIcono],
  // Links en la zona de la cuenta cuando hay sesión
  enlacesCuenta: [
    { etiqueta: "Mis pedidos", a: "/mis-pedidos" },
    { etiqueta: "Mis datos", a: "/mis-datos" },
  ],
  // Montados una vez en el layout de la tienda (no dibujan nada)
  globales: [SincronizarCarrito],
  // Acción debajo del precio en el detalle de producto (recibe la presentación elegida)
  accionesProducto: [AgregarAlPedido],

  rutasPublicas: [
    { path: "carrito", lazy: cargar(() => import("./paginas/carrito_page.jsx")) },
    {
      // Estas necesitan sesión: sin sesión llevan al login y vuelven acá.
      element: (
        <RutaProtegida>
          <Outlet />
        </RutaProtegida>
      ),
      children: [
        { path: "pedido/confirmar", lazy: cargar(() => import("./paginas/confirmar_pedido_page.jsx")) },
        { path: "mis-pedidos", lazy: cargar(() => import("./paginas/mis_pedidos_page.jsx")) },
        { path: "mis-pedidos/:id", lazy: cargar(() => import("./paginas/pedido_cliente_page.jsx")) },
        { path: "mis-datos", lazy: cargar(() => import("./paginas/mis_datos_page.jsx")) },
      ],
    },
  ],

  rutasAdmin: [
    { path: "pedidos", lazy: cargar(() => import("./admin/pedidos_page.jsx")) },
    { path: "pedidos/:id", lazy: cargar(() => import("./admin/pedido_panel_page.jsx")) },
  ],

  menuAdmin: {
    titulo: "Ventas",
    icono: ShoppingBag,
    roles: ROLES_PANEL,
    items: [{ etiqueta: "Pedidos", a: "/admin/pedidos", icono: ClipboardList }],
  },

  resumenAdmin: lazy(() => import("./admin/resumen_pedidos.jsx")),
};
