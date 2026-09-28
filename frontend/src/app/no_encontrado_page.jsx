import { Link } from "react-router-dom";

export default function NoEncontradoPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-titulos text-6xl font-bold text-acento">404</p>
      <h1 className="mt-4 text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-texto-suave">Puede que el link esté mal escrito o que la sección todavía no esté disponible.</p>
      <Link to="/" className="mt-8 inline-block rounded-xl bg-primario px-5 py-3 font-semibold text-primario-texto hover:bg-primario-hover">
        Volver al inicio
      </Link>
    </section>
  );
}
