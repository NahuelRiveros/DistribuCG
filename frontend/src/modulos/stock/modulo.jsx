import { lazy } from "react";
import { Boxes, PackagePlus, Warehouse } from "lucide-react";
import { ROLES_PANEL } from "compartido/reglas/roles.js";

// Lo que el módulo stock aporta a la app: solo pantallas del panel (la tienda
// muestra la disponibilidad desde el catálogo).
const cargar = (importar) => async () => ({ Component: (await importar()).default });

export const moduloStock = {
  codigo: "stock",

  rutasAdmin: [
    { path: "stock", lazy: cargar(() => import("./admin/existencias_page.jsx")) },
    { path: "stock/ingreso", lazy: cargar(() => import("./admin/ingreso_page.jsx")) },
    { path: "stock/:id", lazy: cargar(() => import("./admin/historial_page.jsx")) },
  ],

  menuAdmin: {
    titulo: "Stock",
    icono: Warehouse,
    roles: ROLES_PANEL,
    items: [
      // exacto: no marcarlo activo en /admin/stock/ingreso
      { etiqueta: "Existencias", a: "/admin/stock", icono: Boxes, exacto: true },
      { etiqueta: "Ingreso de mercadería", a: "/admin/stock/ingreso", icono: PackagePlus },
    ],
  },

  resumenAdmin: lazy(() => import("./admin/resumen_stock.jsx")),
};
