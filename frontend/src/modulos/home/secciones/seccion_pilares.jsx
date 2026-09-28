import Icono from "@/componentes/ui/icono.jsx";
import EncabezadoSeccion from "./encabezado_seccion.jsx";

export default function SeccionPilares({ id, kicker, titulo, items = [] }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
      <EncabezadoSeccion kicker={kicker} titulo={titulo} />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.titulo} className="rounded-2xl border border-borde bg-superficie p-6 shadow-sm">
            <span className="inline-flex rounded-xl bg-primario/10 p-3 text-primario">
              <Icono nombre={item.icono} className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{item.titulo}</h3>
            <p className="mt-2 text-texto-suave">{item.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
