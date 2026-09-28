import EncabezadoSeccion from "./encabezado_seccion.jsx";

export default function SeccionPasos({ id, kicker, titulo, items = [] }) {
  return (
    <section id={id} className="scroll-mt-20 bg-superficie">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EncabezadoSeccion kicker={kicker} titulo={titulo} />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((paso, indice) => (
            <li key={paso.titulo} className="rounded-2xl border border-borde p-6">
              <span className="font-titulos text-3xl font-bold text-acento">{String(indice + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-lg font-semibold">{paso.titulo}</h3>
              <p className="mt-2 text-texto-suave">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
