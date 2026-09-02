import { useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { agruparEjerciciosPorZona } from "./kinesiologia_zonas.js";
import { ORDEN_DIAS, DIA_LABEL } from "../dias_semana.js";

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

function SelectorDias({ dias, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ORDEN_DIAS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onToggle(d)}
          title={DIA_LABEL[d]}
          className={`h-6 w-6 shrink-0 rounded-md text-[10px] font-bold transition ${
            dias.includes(d)
              ? "bg-(--kt-teal-700) text-white"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }`}
        >
          {DIA_LABEL[d].slice(0, 1)}
        </button>
      ))}
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
        // Rutinas guardadas antes de tener días asignados quedan en [] en la
        // base — se tratan acá como "todos los días" para no perder lo ya
        // configurado hasta que el kinesiólogo las ajuste.
        dias: r.dias?.length ? r.dias : [...ORDEN_DIAS],
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
    setItems((lista) => [...lista, { ...item, dias: [] }]);
  }

  function quitarItem(index) {
    setItems((lista) => lista.filter((_, i) => i !== index));
  }

  function toggleDia(index, dia) {
    setItems((lista) => lista.map((item, i) => {
      if (i !== index) return item;
      const dias = item.dias.includes(dia) ? item.dias.filter((d) => d !== dia) : [...item.dias, dia];
      return { ...item, dias };
    }));
  }

  async function guardar() {
    if (items.some((i) => !i.dias?.length)) {
      setError("Elegí al menos un día de la semana para cada ejercicio de la rutina.");
      return;
    }
    setError(null);
    await onGuardar(items.map((i) => ({ ejercicio_id: i.ejercicio_id, dias: i.dias })));
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
            Elegí los ejercicios que le corresponden a este paciente y en qué días de la semana. Esto arma la matriz de seguimiento agrupada por día.
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
                  <li key={`${item.ejercicio_id}-${i}`} className="rounded-lg border border-(--kt-teal-700)/15 bg-(--kt-teal-700)/5 px-3 py-2 text-sm space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-slate-800">{item.nombre}</p>
                      <button type="button" onClick={() => quitarItem(i)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                    <SelectorDias dias={item.dias} onToggle={(dia) => toggleDia(i, dia)} />
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
