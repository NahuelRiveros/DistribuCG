import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowDown, ImageOff,
} from "lucide-react";
import { useHomeContent } from "../../hooks/use_home_content.js";
import { useHomeConfig } from "../../hooks/use_home_config.js";
import { iconoHome } from "../../controls/config/home_iconos.js";
import { brandConfig } from "../../config/brand_config.js";
import {
  HOME_TEXTOS_DEFAULT, HOME_VALOR, HOME_COMO_PEDIR, HOME_PILARES, HOME_CONTACTOS,
} from "../../config/home_config.js";
import HomeCarousel from "./home_carousel.jsx";

function contenidoASlide(c) {
  return {
    url: c.cloudinary_url,
    tipoMedia: c.tipo_media,
    title: c.titulo,
    subtitle: c.descripcion,
  };
}

export default function HomePage() {
  const { areas, loading, contenidosDeArea } = useHomeContent();
  const { texto, pilares, contactos, layoutDeArea } = useHomeConfig();
  // Si no hay nada cargado desde /admin/home-config (caso normal: se vació
  // la base a propósito para que home_config.js sea la única fuente), se
  // usan los pilares/contactos fijos del config — igual forma, mismo mapeo
  // de íconos, así el home nunca se queda sin esta sección.
  const pilaresAMostrar = pilares.length > 0 ? pilares : HOME_PILARES;
  const contactosAMostrar = contactos.length > 0 ? contactos : HOME_CONTACTOS;

  const areasConContenido = areas
    .map((a) => ({ ...a, slides: contenidosDeArea(a.descripcion).map(contenidoASlide) }))
    .filter((a) => a.slides.length > 0);

  return (
    <div className="kt-body min-h-screen bg-white text-[var(--kt-ink)]">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-b from-[var(--kt-bg-soft)] to-white">
        <div className="kt-dotgrid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,black,transparent)]" />

        <KineticPath className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] opacity-70 md:right-0" />

        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-28 text-center sm:pt-36">
          <div className="kt-a1 inline-flex items-center gap-2 rounded-full border border-[var(--kt-border)] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kt-petrol)] shadow-sm">
            <span className="kt-pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--kt-turquoise)]" />
            {texto("hero_kicker", brandConfig.rubro)}
          </div>

          {/* Titular real en vez del logo a tamaño gigante — GC no tiene
              isotipo propio todavía (ver brand_config.js), así que ahí antes
              se veía solo la sigla "GC" sola y enorme, sin decir nada del
              negocio; el logo de marca ya está siempre visible en el navbar. */}
          <h1 className="kt-display kt-a2 mt-8 text-4xl font-bold leading-[1.05] text-[var(--kt-ink)] text-balance sm:text-6xl">
            {texto("hero_titulo", HOME_TEXTOS_DEFAULT.hero_titulo)}{" "}
            <span className="text-(--kt-teal-700)">{texto("hero_titulo_resaltado", HOME_TEXTOS_DEFAULT.hero_titulo_resaltado)}</span>
          </h1>

          <p className="kt-a3 mx-auto mt-6 max-w-lg text-base leading-relaxed text-[var(--kt-ink-soft)] sm:text-lg">
            {texto("hero_subtitulo", HOME_TEXTOS_DEFAULT.hero_subtitulo)}
          </p>

          <div className="kt-a4 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/distribuidora/catalogo"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-(--kt-accent-comercial) px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-(--kt-accent-comercial)/30 transition-all duration-200 hover:bg-(--kt-accent-comercial-hover) hover:shadow-(--kt-accent-comercial-hover)/30"
            >
              {texto("hero_cta_primario", HOME_TEXTOS_DEFAULT.hero_cta_primario)}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#como-pedir"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--kt-border)] bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[var(--kt-ink)] transition-all duration-200 hover:border-[var(--kt-turquoise)] hover:text-[var(--kt-petrol)]"
            >
              {texto("hero_cta_secundario", HOME_TEXTOS_DEFAULT.hero_cta_secundario)}
            </a>
          </div>

          <a
            href="#como-pedir"
            aria-label="Bajar a la siguiente sección"
            className="mt-16 inline-flex flex-col items-center gap-2 text-[var(--kt-ink-soft)] transition-colors hover:text-[var(--kt-petrol)]"
          >
            <span className="text-[10px] uppercase tracking-[0.25em]">Descubrí más</span>
            <ArrowDown size={16} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ── VALOR (chips) ─────────────────────────────────── */}
      <section className="border-y border-[var(--kt-border)] bg-[var(--kt-bg-soft)] py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 sm:grid-cols-4">
          {HOME_VALOR.map(({ icon, label }) => {
            const Icon = icon;
            return (
              <div key={label} className="flex flex-col items-center gap-2.5 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--kt-petrol)] shadow-sm ring-1 ring-[var(--kt-border)]">
                  <Icon size={19} />
                </div>
                <span className="text-xs font-semibold leading-tight text-[var(--kt-ink)]">{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CÓMO PEDIR — 3 pasos, secuencia real (por eso la numeración) ── */}
      {HOME_COMO_PEDIR.length > 0 && (
        <section id="como-pedir" className="py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <SectionKicker>{texto("como_pedir_kicker", HOME_TEXTOS_DEFAULT.como_pedir_kicker)}</SectionKicker>
            <h2 className="kt-display mt-3 text-4xl font-bold uppercase leading-none sm:text-5xl">
              {texto("como_pedir_titulo", HOME_TEXTOS_DEFAULT.como_pedir_titulo)}
            </h2>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {HOME_COMO_PEDIR.map(({ numero, titulo, texto: cuerpo }, i) => (
                <div key={numero} className="relative">
                  {/* Línea conectora entre pasos — solo desktop, no tiene
                      sentido en una columna sola de mobile. */}
                  {i < HOME_COMO_PEDIR.length - 1 && (
                    <div className="kt-line-grow absolute left-7 top-7 hidden h-px w-full bg-[var(--kt-border)] md:block" />
                  )}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-(--kt-teal-700) to-[var(--kt-petrol)] text-white shadow-md shadow-[var(--kt-turquoise)]/25">
                    <span className="kt-display text-xl font-bold">{numero}</span>
                  </div>
                  <h3 className="kt-display mt-5 text-xl font-bold">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--kt-ink-soft)]">{cuerpo}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PILARES (editables desde /admin/home-config) ──── */}
      <section id="pilares" className="bg-[var(--kt-bg-soft)] py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <SectionKicker>{texto("pilares_kicker", HOME_TEXTOS_DEFAULT.pilares_kicker)}</SectionKicker>
          <h2 className="kt-display mt-3 text-4xl font-bold uppercase leading-none sm:text-5xl">
            {texto("pilares_titulo", HOME_TEXTOS_DEFAULT.pilares_titulo)}
            <span className="block text-(--kt-teal-700)">{texto("pilares_titulo_resaltado", HOME_TEXTOS_DEFAULT.pilares_titulo_resaltado)}</span>
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pilaresAMostrar.map(({ id, icono, titulo, texto: cuerpo }) => {
              const Icon = iconoHome(icono);
              return (
                <div
                  key={id}
                  className="kt-card group rounded-3xl border border-[var(--kt-border)] bg-white p-8 shadow-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-(--kt-teal-700) to-[var(--kt-petrol)] text-white shadow-md shadow-[var(--kt-turquoise)]/25 transition-transform duration-300 group-hover:scale-105">
                    <Icon size={26} />
                  </div>
                  <h3 className="kt-display mt-6 text-2xl font-bold">{titulo}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[var(--kt-ink-soft)]">{cuerpo}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GALERÍA CONFIGURABLE (grid o carrusel, por área) ── */}
      <section id="galeria" className="bg-[var(--kt-bg-soft)] py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <SectionKicker>{texto("galeria_kicker", HOME_TEXTOS_DEFAULT.galeria_kicker)}</SectionKicker>
          <h2 className="kt-display mt-3 text-4xl font-bold uppercase leading-none sm:text-5xl">
            {texto("galeria_titulo", HOME_TEXTOS_DEFAULT.galeria_titulo)}
          </h2>

          {!loading && areasConContenido.length === 0 && (
            <div className="mt-14 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[var(--kt-border)] bg-white py-20 text-center">
              <ImageOff size={28} className="text-[var(--kt-ink-soft)]" />
              <p className="text-sm font-semibold text-[var(--kt-ink)]">Todavía no hay contenido cargado</p>
              <p className="max-w-sm text-xs text-[var(--kt-ink-soft)]">
                Las fotos y videos que se suban desde el panel de administración van a aparecer acá, agrupadas por área.
              </p>
            </div>
          )}

          {areasConContenido.map((area) => (
            <div key={area.id} className="mt-14 first:mt-10">
              <h3 className="kt-display text-xl font-bold text-[var(--kt-petrol)]">{area.descripcion}</h3>

              {layoutDeArea(area.descripcion) === "carrusel" ? (
                <div className="mt-5">
                  <HomeCarousel items={area.slides} renderItem={(slide, i) => <GalleryCard key={i} slide={slide} />} />
                </div>
              ) : (
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {area.slides.map((slide, i) => (
                    <GalleryCard key={i} slide={slide} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACTO (editable desde /admin/home-config) ──── */}
      <section id="contacto" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <SectionKicker>{texto("contacto_kicker", HOME_TEXTOS_DEFAULT.contacto_kicker)}</SectionKicker>
          <h2 className="kt-display mt-3 text-4xl font-bold uppercase leading-none sm:text-5xl">
            {texto("contacto_titulo", HOME_TEXTOS_DEFAULT.contacto_titulo)}
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {contactosAMostrar.map(({ id, icono, label, valor, href }) => {
              const Icon = iconoHome(icono);
              return (
                <a
                  key={id}
                  href={href || "#"}
                  className="kt-card group flex items-center gap-4 rounded-3xl border border-[var(--kt-border)] bg-white p-6 shadow-sm transition-colors hover:border-[var(--kt-turquoise)]"
                >
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[var(--kt-turquoise-soft)] text-[var(--kt-petrol)] transition-colors group-hover:bg-(--kt-teal-700) group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--kt-ink)]">{label}</div>
                    <div className="mt-0.5 text-sm text-[var(--kt-ink-soft)]">{valor}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA (editable desde /admin/home-config) ── */}
      <section className="relative overflow-hidden border-t border-[var(--kt-border)] bg-linear-to-br from-[var(--kt-petrol)] to-(--kt-teal-700) py-24 px-6 text-center text-white">
        <KineticPath className="pointer-events-none absolute -left-20 -bottom-20 h-[360px] w-[360px] opacity-20" light />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="kt-display text-5xl font-bold uppercase leading-none sm:text-6xl">
            {texto("footer_cta_titulo", HOME_TEXTOS_DEFAULT.footer_cta_titulo)}
            <span className="block">{texto("footer_cta_titulo_resaltado", HOME_TEXTOS_DEFAULT.footer_cta_titulo_resaltado)}</span>
          </h2>
          <p className="mt-6 text-base text-white/85">
            {texto("footer_cta_texto", brandConfig.tagline)}
          </p>
        </div>
      </section>

    </div>
  );
}

function SectionKicker({ children }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--kt-teal-700)">
      {children}
    </span>
  );
}

function GalleryCard({ slide }) {
  return (
    <div className="kt-img-card h-full rounded-3xl border border-[var(--kt-border)] bg-white shadow-sm overflow-hidden">
      <div className="relative h-56 overflow-hidden bg-[var(--kt-bg-soft)]">
        {slide.tipoMedia === "video" ? (
          <video
            src={slide.url}
            className="h-full w-full object-cover"
            autoPlay muted loop playsInline controls
          />
        ) : (
          <img src={slide.url} alt={slide.title || ""} className="h-full w-full object-cover" />
        )}
      </div>
      {(slide.title || slide.subtitle) && (
        <div className="p-5">
          {slide.title && <h4 className="text-sm font-bold text-[var(--kt-ink)]">{slide.title}</h4>}
          {slide.subtitle && <p className="mt-1 text-xs leading-relaxed text-[var(--kt-ink-soft)]">{slide.subtitle}</p>}
        </div>
      )}
    </div>
  );
}

function KineticPath({ className = "", light = false }) {
  const stroke = light ? "var(--kt-bg)" : "var(--kt-turquoise)";
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 320 C 100 320, 100 200, 180 200 S 260 80, 340 80"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="8 10"
        opacity="0.55"
      />
      <path
        d="M20 200 C 90 200, 110 300, 190 300 S 280 180, 380 180"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="240"
        className="kt-flow-path"
      />
      <circle cx="380" cy="180" r="5" fill={stroke} className="kt-pulse-dot" />
    </svg>
  );
}
