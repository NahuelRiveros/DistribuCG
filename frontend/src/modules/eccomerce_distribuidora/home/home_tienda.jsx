import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgePercent, Box, Cookie, Dog, LayoutGrid, Package, Search, ShoppingBasket, Sparkles, Wine, Snowflake } from "lucide-react";
import { useAuth } from "../../../core/auth/auth_context.jsx";
import { brandConfig } from "../../../proyecto/config/brand_config.js";
import { HOME_TIENDA, HOME_VALOR } from "../../../proyecto/config/home_config.js";
import { storefrontConfig as config } from "../storefront_config.js";
import { getProductos, getOfertas, VISTA_TIENDA } from "../api/producto_distribuidora_api.js";
import { getCategorias } from "../api/categoria_distribuidora_api.js";
import OfertasDestacadas from "./ofertas_destacadas.jsx";
import FilasPorFamilia from "./filas_por_familia.jsx";
import { elegirFamiliasDestacadas } from "../utils/categoria_jerarquia.js";
import TrazoAnimado from "../../../core/modules/home/trazo_animado.jsx";
import "./home.css";

const iconosFamilia = [
  [/almac[eé]n/i, ShoppingBasket], [/bebida|vino|cerveza/i, Wine],
  [/limpieza|perfumer[ií]a/i, Sparkles], [/galletita|golosina/i, Cookie],
  [/mascota/i, Dog], [/congelado|l[aá]cteo|helado/i, Snowflake],
];

function FotoProducto({ producto, clase = "" }) {
  const [fallo, setFallo] = useState(false);
  return producto.imagen_url && !fallo
    ? <img src={producto.imagen_url} alt={producto.nombre} onError={() => setFallo(true)} className={`h-full w-full object-contain p-3 ${clase}`} loading="lazy" decoding="async" />
    : <Package size={38} aria-hidden="true" className="text-(--kt-petrol)" />;
}

export default function HomeTienda({ textos = HOME_TIENDA }) {
  const navigate = useNavigate();
  const { isAuth, usuario } = useAuth();
  const puedeVer = config.enabled && (config.publicCatalog || isAuth);
  const visitante = usuario?.usuario_id ?? "visitante";
  const productos = useQuery({
    queryKey: ["home", "productos", visitante],
    // CAT-61: el recuadro de la portada muestra 3 con foto; el catálogo sigue por orden alfabético.
    queryFn: ({ signal }) => getProductos({ pagina: 1, por_pagina: 3, orden: "con_foto", ...VISTA_TIENDA }, { signal, publicAccess: config.publicCatalog && !isAuth }),
    enabled: puedeVer, staleTime: 60_000,
  });
  const categorias = useQuery({
    queryKey: ["home", "categorias", visitante], queryFn: () => getCategorias(VISTA_TIENDA),
    enabled: puedeVer, staleTime: 5 * 60_000,
  });
  const ofertas = useQuery({
    queryKey: ["storefront", "ofertas", visitante],
    queryFn: ({ signal }) => getOfertas({ limite: 12 }, { signal, publicAccess: config.publicCatalog && !isAuth }),
    enabled: puedeVer, staleTime: 60_000,
  });
  const lista = Array.isArray(productos.data?.data) ? productos.data.data.filter((p) => p.activo !== false && p.variedades?.some((v) => v.precio != null)) : [];
  const promociones = !ofertas.isError && Array.isArray(ofertas.data?.data) ? ofertas.data.data : [];
  const hayOfertas = puedeVer && promociones.length > 0;
  const familias = (Array.isArray(categorias.data) ? categorias.data : []).filter((c) => c.padre_id == null);
  const destacadas = elegirFamiliasDestacadas(Array.isArray(categorias.data) ? categorias.data : [], textos.familiasDestacadas, textos.cantidadFamilias);
  const destacados = hayOfertas ? promociones : lista;
  const fotos = [...destacados.filter((p) => p.imagen_url), ...destacados.filter((p) => !p.imagen_url)].slice(0, 3);
  const destino = hayOfertas ? config.catalogPath + "?oferta=1" : config.catalogPath;
  const buscar = (event) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(config.catalogPath + (q ? "?" + new URLSearchParams({ q }) : ""));
  };

  return <div className="dc-home">
    <section aria-labelledby="home-titulo" className="dc-home-hero relative isolate overflow-hidden bg-(--kt-night) text-white">
      <div aria-hidden="true" className="dc-hero-orbit dc-hero-orbit-one" />
      <div aria-hidden="true" className="dc-hero-orbit dc-hero-orbit-two" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[540px] lg:grid-cols-[1fr_.9fr] lg:gap-12 lg:py-16">
        <div className="dc-hero-copy relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-(--kt-accent-on-dark)" />{brandConfig.rubro}</p>
          <h1 id="home-titulo" className="kt-display mt-5 max-w-2xl text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.15rem]">
            {textos.heroTitulo}{textos.heroTituloResaltado && <span className="dc-hero-highlight"> {textos.heroTituloResaltado}</span>}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">{textos.heroSubtitulo}</p>
          {config.enabled && <form role="search" aria-label="Buscar en el catálogo" onSubmit={buscar} className="dc-home-search mt-7 flex min-w-0 items-center gap-2 rounded-2xl bg-white p-1.5 text-(--kt-ink) shadow-2xl shadow-black/20 focus-within:ring-2 focus-within:ring-(--kt-accent-on-dark)">
            <Search size={19} aria-hidden="true" className="ml-3 hidden shrink-0 text-(--kt-ink-soft) sm:block" />
            <label htmlFor="home-busqueda" className="sr-only">{config.labels.search}</label>
            <input id="home-busqueda" name="q" type="search" maxLength={160} placeholder={textos.buscarPlaceholder} className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-(--kt-ink-mute)" />
            <button type="submit" className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-(--kt-accent-comercial) px-4 text-sm font-bold text-white transition hover:bg-(--kt-accent-comercial-hover) sm:px-5">Buscar <ArrowRight size={16} aria-hidden="true" /></button>
          </form>}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {config.enabled && <Link to={config.catalogPath} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-white underline decoration-white/35 underline-offset-4 transition hover:decoration-white">{textos.heroCta}<ArrowRight size={16} aria-hidden="true" /></Link>}
            {hayOfertas && <Link to={config.catalogPath + "?oferta=1"} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-(--kt-accent-on-dark) underline decoration-(--kt-accent-on-dark)/40 underline-offset-4 transition hover:decoration-(--kt-accent-on-dark)"><BadgePercent size={16} aria-hidden="true" />Ver ofertas</Link>}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">{HOME_VALOR.slice(0, 3).map(({ icon: Icon, label }) => <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/70"><Icon size={15} className="text-(--kt-accent-on-dark)" aria-hidden="true" />{label}</span>)}</div>
        </div>

        {config.enabled && <aside aria-label={hayOfertas ? "Promociones destacadas" : "Explorá el catálogo"} className="dc-hero-feature relative min-w-0 overflow-hidden rounded-[1.75rem] border border-white/15 bg-white p-4 text-(--kt-ink) shadow-2xl shadow-black/25 sm:p-5">
          <div className="flex items-start justify-between gap-3 px-1 pt-1">
            <div><p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.19em] text-(--kt-accent-comercial)">{hayOfertas ? <BadgePercent size={16} aria-hidden="true" /> : <ShoppingBasket size={16} aria-hidden="true" />}{hayOfertas ? textos.promoEtiqueta : textos.catalogoEtiqueta}</p><h2 className="kt-display mt-2 max-w-sm text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{hayOfertas ? textos.promoTitulo : textos.catalogoTitulo}</h2></div>
            <span className="dc-feature-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--kt-bg-soft) text-(--kt-petrol)"><Box size={20} aria-hidden="true" /></span>
          </div>
          <p className="mt-2 max-w-sm px-1 text-sm leading-relaxed text-(--kt-ink-soft)">{hayOfertas ? textos.promoTexto : textos.catalogoTexto}</p>
          {fotos.length > 0
            ? <div className="dc-feature-products my-5 grid grid-cols-3 gap-2 sm:gap-3">{fotos.map((p, i) => <Link key={p.id} to={config.catalogPath + "/" + p.id} aria-label={`Ver ${p.nombre}`} className={`dc-feature-product group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-(--kt-border) bg-(--kt-bg-soft) transition duration-300 hover:-translate-y-1 hover:border-(--kt-accent-comercial)/40 hover:shadow-lg ${i === 1 ? "dc-feature-product-raised" : ""}`}><div className="flex aspect-square items-center justify-center bg-white"><FotoProducto producto={p} /></div><span className="line-clamp-2 min-h-10 px-2.5 py-2 text-[10px] font-bold leading-tight text-(--kt-ink) sm:text-xs">{p.nombre}</span></Link>)}</div>
            : <div aria-hidden="true" className="my-5 flex h-32 items-center justify-center rounded-2xl border border-(--kt-border) bg-(--kt-bg-soft)"><ShoppingBasket size={56} strokeWidth={1.25} className="text-(--kt-accent-comercial)" /></div>}
          <Link to={destino} className="group mt-auto flex min-h-12 items-center justify-between gap-3 rounded-xl bg-(--kt-bg-soft) px-4 text-sm font-extrabold text-(--kt-petrol) transition hover:bg-(--kt-accent-comercial-soft) hover:text-(--kt-accent-comercial)">{hayOfertas ? textos.promoCta : textos.catalogoCta}<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition group-hover:translate-x-0.5"><ArrowRight size={17} aria-hidden="true" /></span></Link>
        </aside>}
      </div>
      <div className="dc-hero-baseline" aria-hidden="true"><span>{brandConfig.nombre.toUpperCase()}</span><span>ABASTECIMIENTO SIMPLE</span><span>FORMOSA · ARGENTINA</span></div>
    </section>

    {puedeVer && <section aria-labelledby="home-familias" className="px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
          <div><p className="dc-section-kicker">{textos.familiasEtiqueta}</p><h2 id="home-familias" className="kt-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{textos.familiasTitulo}</h2></div>
          <Link to={config.catalogPath} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-(--kt-petrol) transition hover:gap-3">Ver todas<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {categorias.isPending ? <Esqueleto cantidad={6} />
          : categorias.isError ? <ErrorConsulta mensaje="No pudimos cargar las categorías." query={categorias} />
          : familias.length === 0 ? <p className="rounded-2xl border border-dashed border-(--kt-border) p-5 text-sm text-(--kt-ink-soft)">Las categorías estarán disponibles próximamente.</p>
          : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{familias.slice(0, 6).map((f, i) => { const Icon = iconosFamilia.find(([patron]) => patron.test(f.nombre))?.[1] ?? LayoutGrid; return <Link key={f.id} to={config.catalogPath + "?categoria=" + f.id} className="dc-family-card group relative flex min-h-36 min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-(--kt-border) bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-(--kt-turquoise-border) hover:shadow-xl hover:shadow-(--kt-petrol)/8" style={{ "--dc-delay": `${i * 55}ms` }}><span aria-hidden="true" className="dc-family-glow" /><span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-(--kt-bg-soft) text-(--kt-petrol) transition group-hover:bg-(--kt-petrol) group-hover:text-white"><Icon size={22} aria-hidden="true" /></span><span className="relative flex items-end justify-between gap-2 text-sm font-extrabold leading-tight"><span className="break-words">{f.nombre}</span><ArrowRight size={15} aria-hidden="true" className="shrink-0 text-(--kt-accent-comercial) transition group-hover:translate-x-1" /></span></Link>; })}</div>}
      </div>
    </section>}

    {puedeVer && <OfertasDestacadas ofertas={ofertas} />}

    {puedeVer && <section aria-labelledby="home-productos" className="px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7"><div><p className="dc-section-kicker">{textos.productosEtiqueta}</p><h2 id="home-productos" className="kt-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{textos.productosTitulo}</h2></div><Link to={config.catalogPath} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-(--kt-petrol) transition hover:gap-3">Explorar catálogo<ArrowRight size={16} aria-hidden="true" /></Link></div>
        {categorias.isPending ? <Esqueleto cantidad={4} />
          : categorias.isError ? <ErrorConsulta mensaje="No pudimos cargar los productos." query={categorias} />
          : destacadas.length === 0 ? catalogoVacio
          : <FilasPorFamilia familias={destacadas} porFamilia={textos.productosPorFamilia} visitante={visitante} publicAccess={config.publicCatalog && !isAuth} vacio={catalogoVacio} />}
      </div>
    </section>}
  </div>;
}

const catalogoVacio = <div className="rounded-2xl border border-dashed border-(--kt-border) p-6 text-sm text-(--kt-ink-soft)">Estamos preparando el catálogo. Pronto vas a encontrar productos para tu próximo pedido.</div>;

function Esqueleto({ cantidad }) {
  return <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" role="status" aria-label="Cargando catálogo">{Array.from({ length: cantidad }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-(--kt-bg-soft) motion-reduce:animate-none" />)}</div>;
}

function ErrorConsulta({ mensaje, query }) {
  return <div role="status" className="rounded-2xl border border-(--kt-border) bg-white p-5 text-sm"><p>{mensaje}</p><button type="button" disabled={query.isFetching} onClick={() => query.refetch()} className="mt-2 min-h-11 font-bold text-(--kt-petrol) underline disabled:opacity-50">{query.isFetching ? "Cargando…" : "Reintentar"}</button></div>;
}
