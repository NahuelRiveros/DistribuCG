import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingBag, Package, Search, X } from "lucide-react";
import { getCategorias } from "../api/categoria_distribuidora_api.js";
import { getProductos } from "../api/producto_distribuidora_api.js";
import { useCarritoDistribuidora } from "../carrito/carrito_context.jsx";
import { precioSinIva, formatearPrecio } from "../utils/precio_iva.js";

function ProductoCard({ producto }) {
  const { addItem } = useCarritoDistribuidora();
  const [agregando, setAgregando] = useState(false);
  const variedades = producto.variedades ?? [];
  const variedadMin = variedades.length
    ? variedades.reduce((min, v) => (Number(v.precio) < Number(min.precio) ? v : min))
    : null;

  const unaSolaVariedad = variedades.length === 1;
  const sinStock = unaSolaVariedad && variedades[0].controla_stock && variedades[0].cantidad <= 0;

  async function agregarRapido() {
    if (!unaSolaVariedad) return;
    setAgregando(true);
    try {
      await addItem({ producto_id: producto.id, variedad_id: variedades[0].id, cantidad: 1 });
    } finally {
      setAgregando(false);
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/distribuidora/catalogo/${producto.id}`} className="relative block aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="rounded-full bg-white/70 p-4 text-slate-300 shadow-sm"><Package size={28} /></div>
          </div>
        )}
        {sinStock && (
          <span className="absolute left-2 top-2 rounded-full border border-slate-200 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            Sin stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        {producto.marca && <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{producto.marca}</p>}
        <Link to={`/distribuidora/catalogo/${producto.id}`} className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-800 hover:text-blue-600">
          {producto.nombre}
        </Link>

        {/* Precio y acción SIEMPRE apilados (no lado a lado) — con la grilla en
            2 columnas en mobile la card queda angosta y "Desde $ X,XX" + un
            botón en la misma fila se pisaban entre sí. */}
        <div className="mt-auto space-y-2 pt-3">
          <div className="min-w-0">
            {variedadMin ? (
              <>
                <p className="font-extrabold text-slate-900">
                  {variedades.length > 1 ? "Desde " : ""}{formatearPrecio(variedadMin.precio)}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  Sin IVA: {formatearPrecio(precioSinIva(variedadMin.precio, variedadMin.iva_porcentaje))}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Sin variedades</p>
            )}
          </div>

          {unaSolaVariedad ? (
            <button
              type="button" onClick={agregarRapido} disabled={agregando || sinStock}
              className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              <ShoppingBag size={13} /> {sinStock ? "Sin stock" : agregando ? "..." : "Agregar"}
            </button>
          ) : (
            <Link to={`/distribuidora/catalogo/${producto.id}`}
              className="block w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-center text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-slate-50">
              Ver opciones
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

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
  // búsqueda se resuelve en el backend (listarProductos ya soporta `q`),
  // no filtrando en el cliente, así también busca fuera de lo ya cargado.
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
          <p className="mt-0.5 text-sm text-slate-500">Buscá un producto o elegí una categoría.</p>
        </div>

        {/* ── Buscador ── */}
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
          />
          {busqueda && (
            <button
              type="button" onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              categoriaId === null ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
            }`}
          >
            Todas
          </button>
          {categoriasRaiz.map((cat) => (
            <button
              key={cat.id} type="button" onClick={() => elegirCategoria(cat.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                categoriaId === cat.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* ── Subcategorías (nivel 2) ── */}
        {subcategorias.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            {subcategorias.map((sub) => (
              <button
                key={sub.id} type="button" onClick={() => elegirCategoria(sub.id)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600"
              >
                {sub.nombre}
              </button>
            ))}
          </div>
        )}

        {/* ── Grilla de productos ── */}
        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center text-sm text-slate-400">
            Cargando productos…
          </div>
        ) : productos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-16 text-center text-sm text-slate-400">
            {busquedaAplicada
              ? <>Ningún producto coincide con "{busquedaAplicada}".</>
              : "No hay productos en esta categoría todavía."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => <ProductoCard key={p.id} producto={p} />)}
          </div>
        )}

      </div>
    </div>
  );
}
