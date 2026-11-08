import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import AdminSpinner from "../../../controls/ui/admin_spinner.jsx";
import { cantidadConUnidad, textoBultos } from "../../../../../unidades_config.js";
import { getProductos } from "../api/producto_distribuidora_api.js";
import { formatearPrecio } from "../utils/precio_iva.js";
import { RUTA_ARTICULOS, rutaFichaArticulo } from "../utils/rutas_articulo.js";

const POR_PAGINA = 10;
const BOTON = "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition";

function Stock({ v }) {
  if (!v?.controla_stock) return null;
  const cantidad = Number(v.cantidad);
  if (cantidad <= 0) return <span className="font-semibold text-rose-700">Sin stock</span>;
  return <span>{Number(v.unidades_por_bulto) > 1 ? textoBultos(cantidad, v) : cantidadConUnidad(cantidad, v.unidad_medida)}</span>;
}

/**
 * Artículos de una categoría, desplegados dentro de "Familias y categorías" (CAT-04 a CAT-07).
 * Se piden recién al abrir la categoría y de a 10: la pantalla sigue liviana con miles de categorías.
 * La clave empieza con "gestion-articulos" para que la ficha, al guardar, también refresque esta lista.
 */
export default function ArticulosDeCategoria({ categoria, nombre, volver }) {
  const articulos = useInfiniteQuery({
    queryKey: ["gestion-articulos", "categoria", categoria.id],
    queryFn: ({ pageParam }) => getProductos({ categoria: categoria.id, pagina: pageParam, por_pagina: POR_PAGINA }),
    initialPageParam: 1,
    getNextPageParam: (ultima) => (ultima.pagina < ultima.total_paginas ? ultima.pagina + 1 : undefined),
  });
  const lista = articulos.data?.pages.flatMap((p) => p.data) ?? [];
  const agregar = (
    <Link to={rutaFichaArticulo({ familia: categoria.id, volver })} className={`${BOTON} bg-(--kt-petrol) text-white hover:bg-(--kt-night)`}>
      <Plus size={16} aria-hidden="true" /> Artículo en {nombre}
    </Link>
  );

  return (
    <section aria-label={`Artículos de ${nombre}`} className="mx-2 mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mx-4">
      {articulos.isPending ? <AdminSpinner />
        : articulos.isError ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm text-rose-800">
            <span>No se pudieron cargar los artículos.</span>
            <button type="button" onClick={() => articulos.refetch()} className={`${BOTON} border border-rose-200 bg-white hover:bg-rose-50`}>Reintentar</button>
          </div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-start gap-3 text-sm text-slate-600">
            <p>Todavía no hay artículos en {nombre}.</p>
            {agregar}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-200 rounded-lg bg-white">
              {lista.map((a) => {
                const v = a.variedades?.[0];
                return (
                  <li key={a.id}>
                    <Link to={rutaFichaArticulo({ id: a.id, volver })} className={`flex min-h-11 items-center gap-3 px-3 py-2 hover:bg-slate-50 ${a.activo ? "" : "text-slate-500"}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold break-words">{a.nombre}</span>
                        <span className="flex flex-wrap gap-x-3 text-xs text-slate-500">
                          <span className="font-mono">{v?.cod_ref ?? "Sin código"}</span>
                          <Stock v={v} />
                          {!a.activo && <span className="rounded-full bg-slate-200 px-2 font-bold text-slate-600">Inactivo</span>}
                        </span>
                      </span>
                      <span className="shrink-0 font-bold">{v && Number(v.precio) > 0 ? formatearPrecio(v.precio) : "Sin precio"}</span>
                      <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {agregar}
              {articulos.hasNextPage && (
                <button type="button" disabled={articulos.isFetchingNextPage} onClick={() => articulos.fetchNextPage()} className={`${BOTON} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}>
                  {articulos.isFetchingNextPage ? "Cargando…" : "Ver más"}
                </button>
              )}
              <Link to={`${RUTA_ARTICULOS}?categoria=${categoria.id}`} className="ml-auto text-sm font-semibold text-(--kt-teal-700) underline-offset-2 hover:underline">Abrir en Artículos</Link>
            </div>
          </>
        )}
    </section>
  );
}
