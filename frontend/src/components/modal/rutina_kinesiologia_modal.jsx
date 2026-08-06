import { useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { agruparEjerciciosPorZona } from "../../utils/kinesiologia_zonas.js";

function SelectorRutinaZona({ zona, opciones, onAgregar }) {
  const [ejercicioId, setEjercicioId] = useState("");

  function agregar() {
    if (!ejercicioId) return;
    const opcion = opciones.find((op) => String(op.value) === String(ejercicioId));
    onAgregar({ ejercicio_id: Number(ejercicioId), nombre: opcion?.label ?? "" });
    setEjercicioId("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{zona}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <select
          value={ejercicioId}
          onChange={(e) => setEjercicioId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-(--kt-teal-700)"
        >
          <option value="">Elegir ejercicio…</option>
          {opciones.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}{op.grupo_muscular ? ` (${op.grupo_muscular})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={agregar}
          disabled={!ejercicioId}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-(--kt-teal-700) px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          <Plus size={13} /> Agregar
        </button>
      </div>
    </div>
  );
}

export default function RutinaKinesiologiaModal({
  abierto, onClose, onGuardar, rutinaActual = [], ejerciciosCatalogo = [], cargando = false,
}) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [abiertoAnterior, setAbiertoAnterior] = useState(false);

  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto);
    if (abierto) {
      setItems((rutinaActual || []).map((r) => ({
        ejercicio_id: r.ejercicio_id,
        nombre: r.ejercicio?.nombre ?? "",
      })));
      setError(null);
    }
  }

  if (!abierto) return null;

  const gruposEjercicios = agruparEjerciciosPorZona(ejerciciosCatalogo);

  function agregarItem(item) {
    if (items.some((i) => i.ejercicio_id === item.ejercicio_id)) {
      setError("Ese ejercicio ya está en la rutina.");
      return;
    }
    setError(null);
    setItems((lista) => [...lista, item]);
  }

  function quitarItem(index) {
    setItems((lista) => lista.filter((_, i) => i !== index));
  }

  async function guardar() {
    await onGuardar(items.map((i) => ({ ejercicio_id: i.ejercicio_id })));
  }

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="border-b border-(--kt-teal-700)/15 px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-(--kt-teal-700)" />
            <h2 className="text-xl font-bold text-gray-900">Configurar rutina</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Elegí los ejercicios que le corresponden a este paciente. Esto arma las filas de la matriz de seguimiento.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {gruposEjercicios.map(({ zona, ejercicios }) => (
            <SelectorRutinaZona key={zona} zona={zona} opciones={ejercicios} onAgregar={agregarItem} />
          ))}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
          )}

          {items.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Rutina actual ({items.length})</p>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={`${item.ejercicio_id}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-(--kt-teal-700)/15 bg-(--kt-teal-700)/5 px-3 py-2 text-sm">
                    <p className="truncate font-semibold text-slate-800">{item.nombre}</p>
                    <button type="button" onClick={() => quitarItem(i)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={cargando} className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={cargando} className="flex-1 rounded-xl bg-(--kt-teal-700) px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {cargando ? "Guardando…" : "Guardar rutina"}
          </button>
        </div>
      </div>
    </div>
  );
}
