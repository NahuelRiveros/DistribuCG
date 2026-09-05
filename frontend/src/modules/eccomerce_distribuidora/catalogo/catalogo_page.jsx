import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getCategorias } from "../api/categoria_distribuidora_api.js";
import { getProductos } from "../api/producto_distribuidora_api.js";
import AdminSpinner from "../../../controls/ui/admin_spinner.jsx";
import AdminEmptyState from "../../../controls/ui/admin_empty_state.jsx";
import ProductoCard from "./producto_card.jsx";

export default function CatalogoDistribuidoraPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaUrl = searchParams.get("categoria");
  const [categorias, setCategorias] = useState([]);
  // El filtro de categoría y la búsqueda viven en la URL (?categoria=ID&q=texto)
  // para poder linkear directo a un resultado — ej. desde el breadcrumb del
  // detalle de producto, o compartir/recargar la página sin perder el filtro.
  const [categoriaId, setCategoriaId] = useState(categoriaUrl ? Number(categoriaUrl) : null);
  const [busqueda, setBusqueda] = useState(searchParams.get("q") ?? "");
  // Versión "aplicada" (con debounce) de la búsqueda — lo que realmente
  // dispara el pedido al servidor y se refleja en la URL. `busqueda` es solo
  // lo que el usuario está tipeando en ese instante.
  const [busquedaAplicada, setBusquedaAplicada] = useState(busqueda);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { getCategorias().then(setCategorias).catch(() => {}); }, []);

  function elegirCategoria(id) {
    setCategoriaId(id);
  }

  // Buscador con debounce — evita un pedido al servidor en cada tecla. La
  // búsqueda se resuelve en el backend (listarProductos ya soporta `q`, con
  // índice trigram para que ILIKE '%texto%' no escanee toda la tabla — ver
  // servidor/src/database/bootstrap.js), no filtrando en el cliente, así
  // también busca fuera de lo ya cargado.
  useEffect(() => {
    const t = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Filtro + búsqueda viven en la URL (?categoria=ID&q=texto) para poder
  // linkear directo a un resultado o recargar sin perderlo.
  useEffect(() => {
    const params = {};
    if (categoriaId) params.categoria = categoriaId;
    if (busquedaAplicada) params.q = busquedaAplicada;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaId, busquedaAplicada]);

  useEffect(() => {
    setCargando(true);
    getProductos({ categoria: categoriaId ?? undefined, q: busquedaAplicada || undefined, por_pagina: 60 })
      .then((r) => setProductos(r.data ?? []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, [categoriaId, busquedaAplicada]);

  const categoriasRaiz = useMemo(() => categorias.filter((c) => !c.padre_id), [categorias]);
  const subcategorias = useMemo(
    () => categorias.filter((c) => c.padre_id === categoriaId),
    [categorias, categoriaId]
  );

  return (
    <div className="kt-body min-h-screen bg-(--kt-bg-soft) p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--kt-teal-700)">
            Nuestra tienda
          </span>
          <h1 className="kt-display mt-1 text-3xl font-bold uppercase leading-none text-(--kt-ink) sm:text-4xl">
            Productos
          </h1>
          <p className="mt-2 text-sm text-(--kt-ink-soft)">Buscá un producto o elegí una categoría.</p>
        </div>

        {/* ── Buscador ── */}
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--kt-ink-soft)" />
          <input
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-2xl border border-(--kt-border) bg-white py-2.5 pl-10 pr-9 text-sm text-(--kt-ink) outline-none transition focus:border-(--kt-teal-700) focus:ring-2 focus:ring-(--kt-turquoise)/30"
          />
          {busqueda && (
            <button
              type="button" onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-(--kt-ink-soft) hover:text-(--kt-ink)"
              title="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Categorías (nivel top) ── */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button" onClick={() => elegirCategoria(null)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              categoriaId === null
                ? "border-(--kt-teal-700) bg-(--kt-teal-700) text-white"
                : "border-(--kt-border) bg-white text-(--kt-ink-soft) hover:border-(--kt-turquoise)"
            }`}
          >
            Todas
          </button>
          {categoriasRaiz.map((cat) => (
            <button
              key={cat.id} type="button" onClick={() => elegirCategoria(cat.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                categoriaId === cat.id
                  ? "border-(--kt-teal-700) bg-(--kt-teal-700) text-white"
                  : "border-(--kt-border) bg-white text-(--kt-ink-soft) hover:border-(--kt-turquoise)"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* ── Subcategorías (nivel 2) ── */}
        {subcategorias.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-(--kt-border) pt-3">
            {subcategorias.map((sub) => (
              <button
                key={sub.id} type="button" onClick={() => elegirCategoria(sub.id)}
                className="rounded-full border border-(--kt-border) bg-white px-3 py-1 text-xs font-medium text-(--kt-ink-soft) hover:border-(--kt-turquoise) hover:text-(--kt-teal-700)"
              >
                {sub.nombre}
              </button>
            ))}
          </div>
        )}

        {/* ── Grilla de productos ── */}
        {cargando ? (
          <div className="rounded-2xl border border-(--kt-border) bg-white shadow-sm">
            <AdminSpinner />
          </div>
        ) : productos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--kt-border) bg-white">
            <AdminEmptyState
              title={busquedaAplicada ? `Ningún producto coincide con "${busquedaAplicada}".` : "No hay productos en esta categoría todavía."}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p, i) => <ProductoCard key={p.id} producto={p} index={i} />)}
          </div>
        )}

      </div>
    </div>
  );
}
