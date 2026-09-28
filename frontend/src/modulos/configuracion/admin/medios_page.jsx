import { useFormContext } from "react-hook-form";
import EditorPagos from "./editor_pagos.jsx";
import FilaMedio from "./fila_medio.jsx";

// "Otro medio" existe para registrar cobros en el panel, pero no se ofrece en la tienda: no se muestra acá.
function ListaMedios() {
  const {
    getValues,
    formState: { errors },
  } = useFormContext();
  const indices = getValues("medios")
    .map((m, i) => (m.valor === "otro" ? null : i))
    .filter((i) => i !== null);
  const errorGeneral = errors.medios?.root?.message ?? errors.medios?.message;

  return (
    <section aria-label="Medios de pago">
      {errorGeneral && (
        <p role="alert" className="mb-3 rounded-lg bg-peligro/10 px-3 py-2 text-sm text-peligro">
          {errorGeneral}
        </p>
      )}
      <ul className="space-y-3">
        {indices.map((i) => (
          <FilaMedio key={i} indice={i} />
        ))}
      </ul>
    </section>
  );
}

export default function MediosPage() {
  return (
    <EditorPagos titulo="Medios de pago" descripcion="Prendé los medios que aceptás. Tocá “Editar” para el descuento, el CBU o las tarjetas.">
      <ListaMedios />
    </EditorPagos>
  );
}
