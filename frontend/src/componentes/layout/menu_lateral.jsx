import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, LogIn, LogOut, UserPlus, X } from "lucide-react";
import { cliente } from "@/clientes/index.js";
import Enlace from "@/componentes/ui/enlace.jsx";

const claseLink = "flex items-center gap-3 rounded-xl px-3 py-3 font-medium hover:bg-fondo";
const claseActivo = "bg-primario/10 text-primario";

/**
 * Menú lateral para celulares: entra desde la derecha con el fondo oscurecido.
 * Siempre está montado (para la animación); cerrado queda `inert` y oculto a lectores de pantalla.
 */
export default function MenuLateral({ abierto, onCerrar, links, usuario, puedeVerPanel, enlacesCuenta, onSalir, amplia = false }) {
  const botonCerrar = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // que no se desplace la página de fondo
    document.addEventListener("keydown", alTeclear);
    botonCerrar.current?.focus();
    return () => {
      document.body.style.overflow = overflowAntes;
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto, onCerrar]);

  return (
    <div className={amplia ? "lg:hidden" : "md:hidden"} inert={!abierto} aria-hidden={!abierto}>
      <div
        className={`fixed inset-0 z-50 bg-texto/45 backdrop-blur-[2px] transition-opacity duration-300 ${abierto ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onCerrar}
        aria-hidden="true"
      />
      <aside
        id="menu-movil"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className={`fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-xs flex-col bg-superficie shadow-2xl transition-transform duration-300 ease-out ${abierto ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-borde px-4">
          <span className="truncate font-titulos text-lg font-bold">{cliente.marca.nombre}</span>
          <button ref={botonCerrar} type="button" onClick={onCerrar} aria-label="Cerrar menú" className="rounded-lg p-2 hover:bg-fondo">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Principal (celular)" className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {links.map((link) =>
              link.Componente ? (
                <li key={link.clave}>
                  <link.Componente variante="celular" onNavegar={onCerrar} />
                </li>
              ) : (
                <li key={link.a}>
                  <Enlace a={link.a} onClick={onCerrar} className={claseLink} claseActiva={claseActivo}>
                    {link.etiqueta}
                  </Enlace>
                </li>
              ),
            )}
          </ul>

          {usuario && (
            <div className="mt-4 border-t border-borde pt-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-texto-suave">Mi cuenta</p>
              <ul className="space-y-1">
                {puedeVerPanel && (
                  <li>
                    <Link to="/admin" onClick={onCerrar} className={claseLink}>
                      <LayoutDashboard className="h-5 w-5" aria-hidden="true" /> Panel
                    </Link>
                  </li>
                )}
                {enlacesCuenta.map((e) => (
                  <li key={e.a}>
                    <Enlace a={e.a} onClick={onCerrar} className={claseLink} claseActiva={claseActivo}>
                      {e.etiqueta}
                    </Enlace>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-borde p-4">
          {usuario ? (
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{usuario.nombre}</span>
                <span className="block truncate text-xs text-texto-suave">{usuario.email}</span>
              </span>
              <button
                type="button"
                onClick={onSalir}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-peligro hover:bg-fondo"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              <Link
                to="/login"
                onClick={onCerrar}
                className="flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-3 text-sm font-semibold text-primario-texto hover:bg-primario-hover"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" /> Ingresar
              </Link>
              <Link
                to="/registro"
                onClick={onCerrar}
                className="flex items-center justify-center gap-2 rounded-xl border border-borde px-4 py-3 text-sm font-semibold hover:bg-fondo"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" /> Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
