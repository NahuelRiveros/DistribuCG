import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Menu } from "lucide-react";
import { ROLES_PANEL, tieneRol } from "compartido/reglas/roles.js";
import { cliente } from "@/clientes/index.js";
import { modulosActivos } from "@/modulos/registro.js";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import Enlace from "@/componentes/ui/enlace.jsx";
import MenuCuenta from "./menu_cuenta.jsx";
import MenuLateral from "./menu_lateral.jsx";

// Links del cliente + los que aportan los módulos activos (ej. "Catálogo"), después del primero ("Inicio").
const [primero, ...resto] = cliente.navbar.links;
const LINKS = [...(primero ? [primero] : []), ...modulosActivos.flatMap((m) => m.navbar ?? []), ...resto];
const EXTRAS = modulosActivos.flatMap((m) => m.navbarExtras ?? []);
const ENLACES_CUENTA = modulosActivos.flatMap((m) => m.enlacesCuenta ?? []);

// Con el menú por categorías hay más ítems: la barra completa recién entra en pantallas "lg".
// (Clases completas y fijas: Tailwind solo genera las que ve escritas.)
export const BARRA_AMPLIA = cliente.navbar.menu_productos === "categorias";
const CLASES = BARRA_AMPLIA
  ? { lista: "hidden items-center gap-1 lg:flex", cuenta: "hidden items-center gap-2 lg:flex", hamburguesa: "rounded-lg p-2 hover:bg-fondo lg:hidden", desde: 1024 }
  : { lista: "hidden items-center gap-1 md:flex", cuenta: "hidden items-center gap-2 md:flex", hamburguesa: "rounded-lg p-2 hover:bg-fondo md:hidden", desde: 768 };

/** Un link, o el componente que aporta un módulo en su lugar (ej. el menú por categorías). */
function ItemBarra({ link }) {
  if (link.Componente) {
    return (
      <li className="flex items-center gap-1">
        <link.Componente variante="escritorio" />
      </li>
    );
  }
  return (
    <li>
      <Enlace a={link.a} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-texto hover:bg-fondo" claseActiva="bg-fondo text-primario">
        {link.etiqueta}
      </Enlace>
    </li>
  );
}

/** Escritorio (md+): links en la barra y "Mi cuenta" desplegable. Celular: menú lateral. */
export default function Navbar() {
  const { marca, navbar } = cliente;
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  const puedeVerPanel = !!usuario && tieneRol(usuario, ROLES_PANEL);

  // Si la ventana pasa a tamaño escritorio, el menú lateral se cierra solo.
  useEffect(() => {
    const escritorio = window.matchMedia?.(`(min-width: ${CLASES.desde}px)`);
    if (!escritorio) return;
    const alCambiar = () => escritorio.matches && setAbierto(false);
    escritorio.addEventListener("change", alCambiar);
    return () => escritorio.removeEventListener("change", alCambiar);
  }, []);

  const salir = () => {
    cerrar();
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-borde bg-superficie/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4" aria-label="Principal">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src={marca.logo} alt="" className="h-9 w-9 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-titulos text-lg font-bold">{marca.nombre}</span>
              {navbar.mostrar_rubro && <span className="hidden text-xs text-texto-suave sm:block">{marca.rubro}</span>}
            </span>
          </Link>

          <ul className={CLASES.lista}>
            {LINKS.map((link) => (
              <ItemBarra key={link.clave ?? link.a} link={link} />
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            {/* Aportados por los módulos (ej. el carrito): visibles también en celular */}
            {EXTRAS.map((Extra, i) => (
              <Extra key={i} />
            ))}
            <div className={CLASES.cuenta}>
              {usuario ? (
                <>
                  {puedeVerPanel && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 rounded-xl bg-primario px-3 py-2 text-sm font-semibold text-primario-texto hover:bg-primario-hover"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Panel
                    </Link>
                  )}
                  <MenuCuenta usuario={usuario} enlacesCuenta={ENLACES_CUENTA} onSalir={salir} />
                </>
              ) : (
                <Link to="/login" className="rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-primario-texto hover:bg-primario-hover">
                  Ingresar
                </Link>
              )}
            </div>
            <button
              type="button"
              className={CLASES.hamburguesa}
              onClick={() => setAbierto(true)}
              aria-expanded={abierto}
              aria-controls="menu-movil"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      <MenuLateral
        abierto={abierto}
        onCerrar={cerrar}
        links={LINKS}
        usuario={usuario}
        puedeVerPanel={puedeVerPanel}
        enlacesCuenta={ENLACES_CUENTA}
        onSalir={salir}
        amplia={BARRA_AMPLIA}
      />
    </>
  );
}
