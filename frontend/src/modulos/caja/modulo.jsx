import { lazy } from "react";
import { Outlet } from "react-router-dom";
import { CalendarDays, ChartColumn, Tags, Wallet } from "lucide-react";
import RutaProtegida from "@/componentes/acceso/ruta_protegida.jsx";

const cargar = (importar) => async () => ({ Component: (await importar()).default });

// Caja: ingresos y egresos del negocio. Solo admin (el super admin pasa cualquier rol).
// Con `submenu`, en el menú del panel aparece como un solo ítem; al entrar se ven sus pestañas.
export const moduloCaja = {
  codigo: "caja",

  rutasAdmin: [
    {
      path: "caja",
      element: (
        <RutaProtegida roles={["admin"]}>
          <Outlet />
        </RutaProtegida>
      ),
      children: [
        { index: true, lazy: cargar(() => import("./admin/balance_page.jsx")) },
        { path: "calendario", lazy: cargar(() => import("./admin/calendario_page.jsx")) },
        { path: "categorias", lazy: cargar(() => import("./admin/categorias_page.jsx")) },
      ],
    },
  ],

  menuAdmin: {
    titulo: "Caja",
    icono: Wallet,
    roles: ["admin"],
    submenu: { raiz: "/admin/caja" },
    items: [
      { etiqueta: "Balance anual", a: "/admin/caja", icono: ChartColumn, exacto: true },
      { etiqueta: "Calendario", a: "/admin/caja/calendario", icono: CalendarDays },
      { etiqueta: "Categorías", a: "/admin/caja/categorias", icono: Tags },
    ],
  },

  resumenAdmin: lazy(() => import("./admin/resumen_caja.jsx")),
};
