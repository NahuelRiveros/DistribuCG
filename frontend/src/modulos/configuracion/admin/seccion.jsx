/** Bloque del formulario de configuración: título, explicación, error general y contenido. */
export default function Seccion({ titulo, descripcion, error, accion, children }) {
  const id = `seccion-${titulo.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-borde bg-superficie p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-lg font-bold">
            {titulo}
          </h2>
          {descripcion && <p className="text-sm text-texto-suave">{descripcion}</p>}
        </div>
        {accion}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-peligro/10 px-3 py-2 text-sm text-peligro">
          {error}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
