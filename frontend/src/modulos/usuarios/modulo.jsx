import { Outlet } from "react-router-dom";
import { Settings, Users } from "lucide-react";
import RutaProtegida from "@/componentes/acceso/ruta_protegida.jsx";

const cargar = (importar) => async () => ({ Component: (await importar()).default });

// Parte del núcleo: siempre activo (no se apaga en proyecto.config.js).
// La sección "Usuarios" es solo para admin; el super admin pasa cualquier control de rol.
export const moduloUsuarios = {
  codigo: "usuarios",
  siempre: true,

  rutasAdmin: [
    {
      path: "usuarios",
      element: (
        <RutaProtegida roles={["admin"]}>
          <Outlet />
        </RutaProtegida>
      ),
      children: [{ index: true, lazy: cargar(() => import("./admin/usuarios_page.jsx")) }],
    },
  ],

  menuAdmin: {
    titulo: "Sistema",
    icono: Settings,
    roles: ["admin"],
    items: [{ etiqueta: "Usuarios", a: "/admin/usuarios", icono: Users }],
  },
};
