export default function EncabezadoSeccion({ kicker, titulo }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {kicker && <p className="text-sm font-semibold uppercase tracking-wider text-acento">{kicker}</p>}
      <h2 className="mt-2 font-titulos text-3xl font-bold sm:text-4xl">{titulo}</h2>
    </div>
  );
}
