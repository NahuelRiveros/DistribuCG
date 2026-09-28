import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { nombreProductos } from "@/clientes/index.js";
import { cn } from "@/utils/cn.js";
import { useCategorias } from "../hooks/use_catalogo.js";
import { armarArbol, totalConSubcategorias } from "../utils/arbol.js";

// En la barra entran unas 6 categorías; las demás van en "Más".
const MAX_VISIBLES = 6;
const aCategoria = (id) => `/catalogo?categoria=${id}`;

/** Categorías marcadas "Mostrar en el menú" (en el orden del panel), cada una con sus subcategorías con productos. */
function useItemsMenu() {
  const { data, isPending } = useCategorias();
  const items = [];
  const recorrer = (nodos) => {
    for (const n of nodos) {
      if (n.en_menu) items.push({ id: n.id, nombre: n.nombre, hijos: n.hijos.filter((h) => totalConSubcategorias(h) > 0) });
      recorrer(n.hijos);
    }
  };
  recorrer(armarArbol(data ?? []));
  return { items, isPending };
}

/** Panel desplegable del escritorio: se abre con el mouse, con click o con Enter, y se cierra con Escape o click afuera. */
function Desplegable({ etiqueta, children }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);
  const boton = useRef(null);
  // Si se abrió al pasar el mouse, el click que sigue no lo cierra (en tablets un toque es "pasar" + "click").
  const porHover = useRef(false);
  const id = useId();

  function entrar() {
    if (!abierto) porHover.current = true;
    setAbierto(true);
  }
  function salir() {
    porHover.current = false;
    setAbierto(false);
  }
  function alternar() {
    if (porHover.current) porHover.current = false;
    else setAbierto((v) => !v);
  }

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !contenedor.current?.contains(e.target) && setAbierto(false);
    const escape = (e) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative" onMouseEnter={entrar} onMouseLeave={salir}>
      <button
        ref={boton}
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        aria-controls={id}
        className={cn("flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-fondo", abierto && "bg-fondo")}
      >
        {etiqueta}
        <ChevronDown className={cn("h-4 w-4 transition-transform", abierto && "rotate-180")} aria-hidden="true" />
      </button>
      {abierto && (
        // pt-2 en vez de margen: el mouse no "cae" en un hueco al bajar hacia el panel
        <div id={id} className="absolute left-0 top-full z-50 pt-2">
          <ul className="min-w-52 rounded-2xl border border-borde bg-superficie p-2 shadow-xl" onClick={() => setAbierto(false)}>
            {children}
          </ul>
        </div>
      )}
    </div>
  );
}

const claseItemPanel = "block rounded-lg px-3 py-2 text-sm hover:bg-fondo";

function ItemEscritorio({ item }) {
  if (item.hijos.length === 0) {
    return (
      <Link to={aCategoria(item.id)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-fondo">
        {item.nombre}
      </Link>
    );
  }
  return (
    <Desplegable etiqueta={item.nombre}>
      {item.hijos.map((h) => (
        <li key={h.id}>
          <Link to={aCategoria(h.id)} className={claseItemPanel}>
            {h.nombre}
          </Link>
        </li>
      ))}
      <li className="mt-1 border-t border-borde pt-1">
        <Link to={aCategoria(item.id)} className={cn(claseItemPanel, "font-semibold text-primario")}>
          Ver todo {item.nombre}
        </Link>
      </li>
    </Desplegable>
  );
}

function GrupoCelular({ item, onNavegar }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const clase = "flex w-full items-center justify-between rounded-xl px-3 py-3 font-medium hover:bg-fondo";
  if (item.hijos.length === 0) {
    return (
      <Link to={aCategoria(item.id)} onClick={onNavegar} className={clase}>
        {item.nombre}
      </Link>
    );
  }
  return (
    <div>
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} aria-controls={id} className={clase}>
        {item.nombre}
        <ChevronDown className={cn("h-5 w-5 transition-transform", abierto && "rotate-180")} aria-hidden="true" />
      </button>
      {abierto && (
        <ul id={id} className="mb-2 ml-3 space-y-0.5 border-l border-borde pl-3">
          <li>
            <Link to={aCategoria(item.id)} onClick={onNavegar} className="block rounded-lg px-3 py-2 text-sm font-semibold text-primario">
              Ver todo {item.nombre}
            </Link>
          </li>
          {item.hijos.map((h) => (
            <li key={h.id}>
              <Link to={aCategoria(h.id)} onClick={onNavegar} className="block rounded-lg px-3 py-2 text-sm hover:bg-fondo">
                {h.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Menú de productos por categorías (clientes/<id>/navbar.js → menu_productos: "categorias").
 * Sin categorías marcadas todavía, muestra el link de siempre: el menú nunca queda sin productos.
 */
export default function MenuCategorias({ variante = "escritorio", onNavegar }) {
  const { items, isPending } = useItemsMenu();
  if (isPending) return null;

  if (items.length === 0) {
    return variante === "escritorio" ? (
      <Link to="/catalogo" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-fondo">
        {nombreProductos}
      </Link>
    ) : (
      <Link to="/catalogo" onClick={onNavegar} className="flex rounded-xl px-3 py-3 font-medium hover:bg-fondo">
        {nombreProductos}
      </Link>
    );
  }

  if (variante === "celular") {
    return items.map((item) => <GrupoCelular key={item.id} item={item} onNavegar={onNavegar} />);
  }

  const visibles = items.slice(0, MAX_VISIBLES);
  const resto = items.slice(MAX_VISIBLES);
  return (
    <>
      {visibles.map((item) => (
        <ItemEscritorio key={item.id} item={item} />
      ))}
      {resto.length > 0 && (
        <Desplegable etiqueta="Más">
          {resto.map((item) => (
            <li key={item.id}>
              <Link to={aCategoria(item.id)} className={claseItemPanel}>
                {item.nombre}
              </Link>
            </li>
          ))}
        </Desplegable>
      )}
    </>
  );
}
