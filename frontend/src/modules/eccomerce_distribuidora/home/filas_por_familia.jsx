import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { storefrontConfig as config } from "../storefront_config.js";
import { getProductos, VISTA_TIENDA } from "../api/producto_distribuidora_api.js";
import HomeCarousel from "../../../core/modules/home/home_carousel.jsx";
import ProductoCard from "../productos/producto_card.jsx";

/**
 * CAT-61: una góndola por familia (la elige `elegirFamiliasDestacadas`), con sus artículos a la venta y
 * primero los que tienen foto. Una fila que viene vacía no se muestra; una que falla ofrece reintentar.
 */
export default function FilasPorFamilia({ familias, porFamilia, visitante, publicAccess, vacio }) {
  const filas = useQueries({
    queries: familias.map((f) => ({
      queryKey: ["home", "familia", f.id, visitante],
      queryFn: ({ signal }) => getProductos({ categoria: f.id, pagina: 1, por_pagina: porFamilia, orden: "con_foto", ...VISTA_TIENDA }, { signal, publicAccess }),
      staleTime: 60_000,
    })),
  });

  const vacias = filas.every((q) => q.isSuccess && !(q.data?.data?.length > 0));
  if (vacias) return vacio;

  return <div className="space-y-10 sm:space-y-12">
    {familias.map((familia, i) => {
      const query = filas[i];
      const productos = Array.isArray(query.data?.data) ? query.data.data : [];
      if (query.isSuccess && productos.length === 0) return null;
      const tituloId = `home-familia-${familia.id}`;
      return <section key={familia.id} aria-labelledby={tituloId}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h3 id={tituloId} className="kt-display text-xl font-extrabold tracking-tight sm:text-2xl">{familia.nombre}</h3>
          <Link to={`${config.catalogPath}?categoria=${familia.id}`} aria-label={`Ver todo ${familia.nombre}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-(--kt-petrol) transition hover:gap-3">
            Ver todo<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {query.isPending
          ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="status" aria-label={`Cargando ${familia.nombre}`}>
              {Array.from({ length: 4 }, (_, j) => <div key={j} className="h-72 animate-pulse rounded-2xl bg-(--kt-bg-soft) motion-reduce:animate-none" />)}
            </div>
          : query.isError
            ? <div role="status" className="rounded-2xl border border-(--kt-border) bg-white p-5 text-sm">
                <p>No pudimos cargar {familia.nombre}.</p>
                <button type="button" disabled={query.isFetching} onClick={() => query.refetch()} className="mt-2 min-h-11 font-bold text-(--kt-petrol) underline disabled:opacity-50">{query.isFetching ? "Cargando…" : "Reintentar"}</button>
              </div>
            : <HomeCarousel items={productos} anchoItem="w-[70%] sm:w-[40%] lg:w-[23%]" renderItem={(p) => <ProductoCard producto={p} />} />}
      </section>;
    })}
  </div>;
}
