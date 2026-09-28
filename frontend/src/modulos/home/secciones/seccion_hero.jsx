import Enlace from "@/componentes/ui/enlace.jsx";

export default function SeccionHero({ kicker, titulo, subtitulo, cta_primario, cta_secundario }) {
  return (
    <section className="bg-primario text-primario-texto">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        {kicker && <p className="text-sm font-semibold uppercase tracking-wider opacity-80">{kicker}</p>}
        <h1 className="mt-3 max-w-3xl font-titulos text-4xl font-bold sm:text-5xl">{titulo}</h1>
        {subtitulo && <p className="mt-5 max-w-2xl text-lg opacity-90">{subtitulo}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {cta_primario && (
            <Enlace a={cta_primario.a} className="rounded-xl bg-acento px-5 py-3 font-semibold text-white hover:opacity-90">
              {cta_primario.texto}
            </Enlace>
          )}
          {cta_secundario && (
            <Enlace a={cta_secundario.a} className="rounded-xl border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">
              {cta_secundario.texto}
            </Enlace>
          )}
        </div>
      </div>
    </section>
  );
}
