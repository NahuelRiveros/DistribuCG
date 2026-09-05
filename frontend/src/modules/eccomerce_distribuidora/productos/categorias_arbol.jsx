import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, LayoutGrid } from "lucide-react";

// item plano (id, nombre, padre_id, cantidad_productos) → árbol con
// { ...item, hijos: [...], total } — `total` es la suma recursiva de
// cantidad_productos propios + de todos los descendientes, para que una
// categoría "padre" (que normalmente no tiene productos cargados directo)
// no muestre "0" aunque tenga cientos adentro de sus subcategorías.
function construirArbol(categorias) {
  const porId = new Map(categorias.map((c) => [c.id, { ...c, hijos: [] }]));
  const raices = [];
  for (const c of categorias) {
    const nodo = porId.get(c.id);
    const padre = c.padre_id != null ? porId.get(c.padre_id) : null;
    if (padre) padre.hijos.push(nodo);
    else raices.push(nodo);
  }
  function total(nodo) {
    nodo.total = nodo.hijos.reduce((suma, hijo) => suma + total(hijo), nodo.cantidad_productos ?? 0);
    return nodo.total;
  }
  raices.forEach(total);
  return raices;
}

// Ids de todos los ancestros de una categoría — para auto-expandir el camino
// hacia la categoría seleccionada (ej. al entrar por un link con ?categoria=8,
// el árbol abre Comestibles > Galletitas solo para mostrar Pepitos ya visible).
function idsAncestros(categorias, id) {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const ids = new Set();
  let actual = porId.get(id);
  while (actual?.padre_id != null) {
    ids.add(actual.padre_id);
    actual = porId.get(actual.padre_id);
  }
  return ids;
}

function Nodo({ nodo, depth, categoriaId, expandidos, toggle, onSeleccionar }) {
  const tieneHijos = nodo.hijos.length > 0;
  const abierto = expandidos.has(nodo.id);
  const activo = categoriaId === nodo.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg py-1.5 pr-2 text-sm transition ${
          activo ? "bg-(--kt-turquoise-soft) font-bold text-(--kt-teal-700)" : "text-(--kt-ink-soft) hover:bg-(--kt-bg-soft)"
        }`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (tieneHijos) toggle(nodo.id); }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${tieneHijos ? "hover:bg-black/5" : "invisible"}`}
        >
          {tieneHijos && (abierto ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </button>
        <button type="button" onClick={() => onSeleccionar(nodo.id)} className="flex-1 truncate text-left">
          {nodo.nombre}
        </button>
        {nodo.total > 0 && <span className="shrink-0 text-xs tabular-nums text-(--kt-ink-soft)">{nodo.total}</span>}
      </div>

      {tieneHijos && abierto && nodo.hijos.map((hijo) => (
        <Nodo
          key={hijo.id} nodo={hijo} depth={depth + 1} categoriaId={categoriaId}
          expandidos={expandidos} toggle={toggle} onSeleccionar={onSeleccionar}
        />
      ))}
    </div>
  );
}

/**
 * Árbol de categorías para navegar/filtrar el catálogo — muestra TODA la
 * jerarquía de una (no un nivel por click como los chips que reemplaza).
 * Clickear el nombre filtra por esa categoría (+ descendientes, ya resuelto
 * en el backend); clickear la flechita solo expande/colapsa sin cambiar el
 * filtro activo.
 */
export default function CategoriasArbol({ categorias, categoriaId, onSeleccionar }) {
  const arbol = useMemo(() => construirArbol(categorias), [categorias]);
  const [expandidos, setExpandidos] = useState(() => new Set(categoriaId != null ? idsAncestros(categorias, categoriaId) : []));

  // Ajuste durante el render (no en un efecto) cuando cambia la categoría
  // seleccionada desde afuera (ej. deep-link con ?categoria=8) — evita el
  // setState síncrono dentro de useEffect y no necesita esperar un ciclo
  // extra de render para abrir el camino hacia la categoría activa.
  const [categoriaIdExpandida, setCategoriaIdExpandida] = useState(categoriaId);
  if (categoriaId !== categoriaIdExpandida) {
    setCategoriaIdExpandida(categoriaId);
    if (categoriaId != null) {
      const nuevos = idsAncestros(categorias, categoriaId);
      setExpandidos((prev) => new Set([...prev, ...nuevos]));
    }
  }

  function toggle(id) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <nav className="space-y-0.5">
      <button
        type="button" onClick={() => onSeleccionar(null)}
        className={`mb-1.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold transition ${
          categoriaId === null ? "bg-(--kt-teal-700) text-white" : "text-(--kt-ink) hover:bg-(--kt-bg-soft)"
        }`}
      >
        <LayoutGrid size={14} /> Todas
      </button>
      {arbol.map((nodo) => (
        <Nodo
          key={nodo.id} nodo={nodo} depth={0} categoriaId={categoriaId}
          expandidos={expandidos} toggle={toggle} onSeleccionar={onSeleccionar}
        />
      ))}
    </nav>
  );
}
