import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";

const claseItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-fondo";

/** Desplegable "Mi cuenta" del navbar en escritorio (los enlaces los aportan los módulos). */
export default function MenuCuenta({ usuario, enlacesCuenta, onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);
  const disparador = useRef(null);
  const cerrar = () => setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !contenedor.current?.contains(e.target) && setAbierto(false);
    const escape = (e) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      disparador.current?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={disparador}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-cuenta"
        aria-label={`Mi cuenta (${usuario.nombre})`}
        className="flex items-center gap-2 rounded-xl border border-borde px-3 py-2 text-sm font-medium hover:bg-fondo"
      >
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="max-w-32 truncate">{usuario.nombre}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {abierto && (
        <div id="menu-cuenta" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-borde bg-superficie p-1.5 shadow-xl">
          <p className="truncate border-b border-borde px-3 pb-2 pt-1.5 text-xs text-texto-suave">{usuario.email}</p>
          <div className="py-1">
            {enlacesCuenta.map((e) => (
              <Link key={e.a} to={e.a} onClick={cerrar} className={claseItem}>
                {e.etiqueta}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              cerrar();
              onSalir();
            }}
            className={`${claseItem} border-t border-borde text-peligro`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
          </button>
        </div>
      )}
    </div>
  );
}
