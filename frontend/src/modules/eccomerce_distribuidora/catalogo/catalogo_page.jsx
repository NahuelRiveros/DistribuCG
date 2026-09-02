import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package } from "lucide-react";
import { getCategorias } from "../api/categoria_distribuidora_api.js";
import { getProductos } from "../api/producto_distribuidora_api.js";
import { useCarritoDistribuidora } from "../carrito/carrito_context.jsx";

const fmt = (n) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

function ProductoCard({ producto }) {
  const { addItem } = useCarritoDistribuidora();
  const [agregando, setAgregando] = useState(false);
  const variedades = producto.variedades ?? [];
  const precios = variedades.map((v) => Number(v.precio));
  const precioMin = precios.length ? Math.min(...precios) : null;

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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/distribuidora/catalogo/${producto.id}`} className="block aspect-square bg-slate-50">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Package size={40} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        {producto.marca && <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{producto.marca}</p>}
        <Link to={`/distribuidora/catalogo/${producto.id}`} className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-800 hover:text-blue-600">
          {producto.nombre}
        </Link>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            {precioMin !== null ? (
              <p className="font-extrabold text-slate-900">
                {variedades.length > 1 ? "Desde " : ""}{fmt(precioMin)}
              </p>
            ) : (
              <p className="text-xs text-slate-400">Sin variedades</p>
            )}
          </div>

          {unaSolaVariedad ? (
            <button
              type="button" onClick={agregarRapido} disabled={agregando || sinStock}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              <ShoppingBag size={13} /> {sinStock ? "Sin stock" : agregando ? "..." : "Agregar"}
            </button>
          ) : (
            <Link to={`/distribuidora/catalogo/${producto.id}`}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Ver opciones
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogoDistribuidoraPage() {
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState(null);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { getCategorias().then(setCategorias).catch(() => {}); }, []);

  useEffect(() => {
    setCargando(true);
    getProductos({ categoria: categoriaId ?? undefined, por_pagina: 60 })
      .then((r) => setProductos(r.data ?? []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, [categoriaId]);

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
          <p className="mt-0.5 text-sm text-slate-500">Elegí una categoría o navegá el catálogo completo.</p>
        </div>

        {/* ── Categorías (nivel top) ── */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button" onClick={() => setCategoriaId(null)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              categoriaId === null ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
            }`}
          >
            Todas
          </button>
          {categoriasRaiz.map((cat) => (
            <button
              key={cat.id} type="button" onClick={() => setCategoriaId(cat.id)}
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
                key={sub.id} type="button" onClick={() => setCategoriaId(sub.id)}
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
            No hay productos en esta categoría todavía.
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
