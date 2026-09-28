import { Minus, Plus } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";

const MAXIMO = proyecto.tienda.max_cantidad_item;

/** − [ 3 ] +  (acepta escribir el número). Llama a onCambiar solo con enteros válidos. */
export default function SelectorCantidad({ valor, onCambiar, deshabilitado = false, etiqueta = "Cantidad" }) {
  const cambiar = (n) => {
    if (Number.isInteger(n) && n >= 1 && n <= MAXIMO && n !== valor) onCambiar(n);
  };
  const boton = "flex h-10 w-10 items-center justify-center text-texto hover:bg-fondo disabled:opacity-40";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-borde bg-superficie">
      <button type="button" className={boton} onClick={() => cambiar(valor - 1)} disabled={deshabilitado || valor <= 1} aria-label="Restar uno">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAXIMO}
        value={valor}
        onChange={(e) => cambiar(Number(e.target.value))}
        disabled={deshabilitado}
        aria-label={etiqueta}
        className="h-10 w-14 border-x border-borde bg-superficie text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className={boton} onClick={() => cambiar(valor + 1)} disabled={deshabilitado || valor >= MAXIMO} aria-label="Sumar uno">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
