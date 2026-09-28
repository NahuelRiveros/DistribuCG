import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { ROLES_PANEL, tieneRol } from "compartido/reglas/roles.js";
import { cliente } from "@/clientes/index.js";
import { modulosActivos } from "@/modulos/registro.js";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import { cn } from "@/utils/cn.js";

const claseLink = ({ isActive }) =>
  cn(
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
    isActive ? "bg-white/15 font-semibold" : "opacity-85 hover:bg-white/10 hover:opacity-100",
  );

function ItemsSeccion({ items, onNavegar }) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ etiqueta, a, icono: IconoItem, exacto }) => (
        <li key={a}>
          <NavLink to={a} end={exacto} onClick={onNavegar} className={claseLink}>
            {IconoItem && <IconoItem className="h-4 w-4" aria-hidden="true" />} {etiqueta}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

// Una sección con `submenu: { raiz }` (ej. Caja) aparece como un solo ítem en el menú general;
// dentro de su raíz, el menú muestra solo sus pestañas y un botón para volver al general.
const estaDentro = (pathname, raiz) => pathname === raiz || pathname.startsWith(`${raiz}/`);

function SubmenuSeccion({ modulo: { codigo, menuAdmin }, onNavegar }) {
  const Icono = menuAdmin.icono;
  return (
    <>
      <Link
        to="/admin"
        onClick={onNavegar}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold opacity-85 transition hover:bg-white/10 hover:opacity-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al panel
      </Link>
      <section aria-labelledby={`menu-${codigo}`}>
        <h2 id={`menu-${codigo}`} className="mb-2 flex items-center gap-2 px-3 font-titulos text-lg font-bold">
          {Icono && <Icono className="h-5 w-5" aria-hidden="true" />} {menuAdmin.titulo}
        </h2>
        <ItemsSeccion items={menuAdmin.items} onNavegar={onNavegar} />
      </section>
    </>
  );
}

function MenuGeneral({ secciones, onNavegar }) {
  return (
    <>
      <NavLink to="/admin" end onClick={onNavegar} className={claseLink}>
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Inicio
      </NavLink>
      {secciones.map(({ codigo, menuAdmin }) => {
        const Icono = menuAdmin.icono;
        if (menuAdmin.submenu) {
          return (
            <Link
              key={codigo}
              to={menuAdmin.submenu.raiz}
              onClick={onNavegar}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm opacity-85 transition hover:bg-white/10 hover:opacity-100"
            >
              {Icono && <Icono className="h-4 w-4" aria-hidden="true" />}
              <span className="flex-1">{menuAdmin.titulo}</span>
              <ChevronRight className="h-4 w-4 opacity-70" aria-hidden="true" />
            </Link>
          );
        }
        return (
          <section key={codigo} aria-labelledby={`menu-${codigo}`}>
            <h2 id={`menu-${codigo}`} className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider opacity-70">
              {Icono && <Icono className="h-3.5 w-3.5" aria-hidden="true" />} {menuAdmin.titulo}
            </h2>
            <ItemsSeccion items={menuAdmin.items} onNavegar={onNavegar} />
          </section>
        );
      })}
    </>
  );
}

function MenuLateral({ onNavegar }) {
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const secciones = modulosActivos.filter((m) => m.menuAdmin && tieneRol(usuario, m.menuAdmin.roles ?? ROLES_PANEL));
  const abierta = secciones.find((m) => m.menuAdmin.submenu && estaDentro(pathname, m.menuAdmin.submenu.raiz));

  return (
    <div className="flex h-full flex-col bg-primario text-primario-texto">
      <Link to="/admin" onClick={onNavegar} className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        <img src={cliente.marca.logo} alt="" className="h-8 w-8 rounded-md bg-white p-0.5" />
        <span className="leading-tight">
          <span className="block font-titulos font-bold">{cliente.marca.nombre}</span>
          <span className="text-xs opacity-75">Panel de administración</span>
        </span>
      </Link>

      <nav aria-label="Panel" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {abierta ? <SubmenuSeccion modulo={abierta} onNavegar={onNavegar} /> : <MenuGeneral secciones={secciones} onNavegar={onNavegar} />}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4 text-sm">
        <p className="px-3 pb-2 opacity-75">{usuario?.nombre}</p>
        <Link to="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/10">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver tienda
        </Link>
        <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/10">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
        </button>
      </div>
    </div>
  );
}

/** Panel de administración: menú lateral propio, separado del diseño de la tienda. */
export default function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrar = () => setMenuAbierto(false);

  return (
    <div className="min-h-screen bg-fondo md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 md:block">
        <MenuLateral />
      </aside>

      {/* Celular: barra superior + menú deslizable */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-borde bg-superficie px-4 py-3 md:hidden">
        <button type="button" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú del panel" aria-expanded={menuAbierto} className="rounded-lg p-2 hover:bg-fondo">
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-titulos font-bold">Panel · {cliente.marca.nombre}</span>
      </header>
      {menuAbierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={cerrar} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <button type="button" onClick={cerrar} aria-label="Cerrar menú del panel" className="absolute right-2 top-3 z-10 rounded-lg p-2 text-primario-texto hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <MenuLateral onNavegar={cerrar} />
          </aside>
        </div>
      )}

      <main id="contenido" className="px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
