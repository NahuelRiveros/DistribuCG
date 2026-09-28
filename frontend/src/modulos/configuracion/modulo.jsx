import { Outlet } from "react-router-dom";
import { BadgePercent, CalendarClock, CreditCard, SlidersHorizontal } from "lucide-react";
import RutaProtegida from "@/componentes/acceso/ruta_protegida.jsx";

const cargar = (importar) => async () => ({ Component: (await importar()).default });

// Configuración del negocio editable desde el panel (núcleo: siempre activo). Solo admin.
// Con `submenu`, aparece como un solo ítem; al entrar se ven sus pestañas.
export const moduloConfiguracion = {
  codigo: "configuracion",
  siempre: true,

  rutasAdmin: [
    {
      path: "configuracion",
      element: (
        <RutaProtegida roles={["admin"]}>
          <Outlet />
        </RutaProtegida>
      ),
      children: [
        { index: true, lazy: cargar(() => import("./admin/medios_page.jsx")) },
        { path: "cuotas", lazy: cargar(() => import("./admin/cuotas_page.jsx")) },
        { path: "promociones", lazy: cargar(() => import("./admin/promociones_page.jsx")) },
      ],
    },
  ],

  menuAdmin: {
    titulo: "Configuración",
    icono: SlidersHorizontal,
    roles: ["admin"],
    submenu: { raiz: "/admin/configuracion" },
    items: [
      { etiqueta: "Medios de pago", a: "/admin/configuracion", icono: CreditCard, exacto: true },
      { etiqueta: "Cuotas", a: "/admin/configuracion/cuotas", icono: CalendarClock },
      { etiqueta: "Promociones", a: "/admin/configuracion/promociones", icono: BadgePercent },
    ],
  },
};
