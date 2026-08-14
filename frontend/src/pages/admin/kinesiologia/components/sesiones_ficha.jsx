import { useState } from "react";
import { Bell, CalendarPlus, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { ORDEN_DIAS, DIA_LABEL } from "../../../../utils/dias_semana.js";
import { formatearFechaAR } from "../../../../components/form/formatear_fecha.js";
import InputField from "../../../../components/form/input_field.jsx";

function fechaHoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Texto base para que el kinesiólogo lo edite en vez de arrancar de cero.
const OBSERVACION_BASE =
  "Realizar los ejercicios indicados en la sesión. Elongar antes y después. Aplicar frío/calor según corresponda.";

/** Arma el link de WhatsApp para un recordatorio, o null si la persona no tiene celular cargado. */
function linkWhatsappRecordatorio(persona, recordatorio) {
  const digitos = String(persona?.celular || "").replace(/\D/g, "");
  if (!digitos) return null;
  const numero = digitos.startsWith("54") ? digitos : `54${digitos}`;

  const dias = recordatorio.dias.map((d) => DIA_LABEL[d]).join(", ");
  const nombre = persona?.nombre ? ` ${persona.nombre}` : "";
  const mensaje =
    `Hola${nombre}! 👋 Te dejamos un recordatorio de kinesiología:\n\n` +
    `📅 ${dias}\n📝 ${recordatorio.observacion}`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
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
          className={`h-7 w-7 shrink-0 rounded-md text-[11px] font-bold transition ${
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

function bloqueVacio() {
  return { key: crypto.randomUUID(), dias: [], observacion: OBSERVACION_BASE };
}

/** Form para crear una sesión nueva: fecha + uno o varios recordatorios (días + observación). */
function NuevaSesionForm({ onCrear }) {
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [bloques, setBloques] = useState([bloqueVacio()]);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function actualizarBloque(key, cambios) {
    setBloques((lista) => lista.map((b) => (b.key === key ? { ...b, ...cambios } : b)));
  }

  function toggleDia(key, dia) {
    setBloques((lista) => lista.map((b) => {
      if (b.key !== key) return b;
      const dias = b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia];
      return { ...b, dias };
    }));
  }

  function agregarBloque() {
    setBloques((lista) => [...lista, bloqueVacio()]);
  }

  function quitarBloque(key) {
    setBloques((lista) => (lista.length > 1 ? lista.filter((b) => b.key !== key) : lista));
  }

  async function guardar() {
    if (bloques.some((b) => !b.dias.length || !b.observacion.trim())) {
      setError("Completá los días y la observación de cada recordatorio (o quitá los que no vayas a cargar)");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const r = await onCrear({
        fecha,
        recordatorios: bloques.map((b) => ({ dias: b.dias, observacion: b.observacion.trim() })),
      });
      if (!r?.ok) { setError(r?.mensaje || "No se pudo guardar la sesión"); return; }
      setFecha(fechaHoyLocal());
      setBloques([bloqueVacio()]);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarPlus size={14} className="text-(--kt-teal-700)" />
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Nueva sesión</p>
      </div>

      <InputField
        id="fecha-nueva-sesion"
        label="Fecha"
        labelClassName="text-[11px] font-bold uppercase tracking-wide text-slate-400"
        hideMessage
        type="date"
        value={fecha}
        max={fechaHoyLocal()}
        onChange={(e) => setFecha(e.target.value)}
      />

      <div className="space-y-2.5">
        {bloques.map((b, i) => (
          <div key={b.key} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Recordatorio {i + 1}</p>
              {bloques.length > 1 && (
                <button type="button" onClick={() => quitarBloque(b.key)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <SelectorDias dias={b.dias} onToggle={(dia) => toggleDia(b.key, dia)} />
            <textarea
              value={b.observacion}
              onChange={(e) => actualizarBloque(b.key, { observacion: e.target.value })}
              rows={2}
              placeholder="Observación (ej: elongar isquiotibiales antes de entrenar tren inferior)"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-(--kt-teal-700)"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarBloque}
        className="inline-flex items-center gap-1 text-xs font-bold text-(--kt-teal-700) hover:underline"
      >
        <Plus size={12} /> Agregar otro recordatorio a esta sesión
      </button>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-full rounded-lg bg-(--kt-teal-700) py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar sesión"}
      </button>
    </div>
  );
}

function RecordatorioItem({ recordatorio, persona, onEliminar }) {
  const waLink = linkWhatsappRecordatorio(persona, recordatorio);

  return (
    <li className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-(--kt-teal-700)/10 text-(--kt-teal-700)">
        <Bell size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {recordatorio.dias.map((d) => (
            <span key={d} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
              {DIA_LABEL[d]}
            </span>
          ))}
        </div>
        <p className="mt-1 text-sm text-slate-700">{recordatorio.observacion}</p>
      </div>
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Enviar por WhatsApp"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
        >
          <MessageCircle size={13} />
        </a>
      )}
      <button type="button" onClick={() => onEliminar(recordatorio.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
        <Trash2 size={13} />
      </button>
    </li>
  );
}

function AgregarRecordatorioInline({ onAgregar }) {
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState([]);
  const [observacion, setObservacion] = useState(OBSERVACION_BASE);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function toggleDia(dia) {
    setDias((actual) => (actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia]));
  }

  async function guardar() {
    if (!dias.length || !observacion.trim()) { setError("Elegí los días y cargá una observación"); return; }
    setError(null);
    setGuardando(true);
    try {
      const r = await onAgregar({ dias, observacion: observacion.trim() });
      if (!r?.ok) { setError(r?.mensaje || "No se pudo agregar"); return; }
      setDias([]); setObservacion(OBSERVACION_BASE); setAbierto(false);
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 text-xs font-bold text-(--kt-teal-700) hover:underline">
        <Plus size={12} /> Agregar recordatorio a esta sesión
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2">
      <SelectorDias dias={dias} onToggle={toggleDia} />
      <textarea
        value={observacion}
        onChange={(e) => setObservacion(e.target.value)}
        rows={2}
        placeholder="Observación"
        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-(--kt-teal-700)"
      />
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button type="button" onClick={guardar} disabled={guardando} className="flex-1 rounded-lg bg-(--kt-teal-700) py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function SesionCard({ sesion, persona, onAgregarRecordatorio, onEliminarRecordatorio, onEliminarSesion }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-500">{formatearFechaAR(sesion.fecha)}</p>
        <button type="button" onClick={() => onEliminarSesion(sesion.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 size={13} />
        </button>
      </div>

      {sesion.recordatorios?.length > 0 && (
        <ul className="space-y-1.5">
          {sesion.recordatorios.map((r) => (
            <RecordatorioItem key={r.id} recordatorio={r} persona={persona} onEliminar={onEliminarRecordatorio} />
          ))}
        </ul>
      )}

      <AgregarRecordatorioInline onAgregar={(payload) => onAgregarRecordatorio(sesion.id, payload)} />
    </div>
  );
}

/**
 * Historial de sesiones de una ficha — cada sesión es una visita (fecha) que
 * puede tener uno o varios recordatorios (días + observación) colgando.
 * Reemplaza a la rutina de ejercicios + matriz de sesiones con escalas.
 */
export default function SesionesFicha({ sesiones = [], persona, onCrearSesion, onEliminarSesion, onAgregarRecordatorio, onEliminarRecordatorio }) {
  return (
    <div className="space-y-3">
      <NuevaSesionForm onCrear={onCrearSesion} />

      {!sesiones.length ? (
        <p className="text-sm text-slate-400">Todavía no hay sesiones cargadas para esta patología.</p>
      ) : (
        <div className="space-y-2.5">
          {sesiones.map((s) => (
            <SesionCard
              key={s.id}
              sesion={s}
              persona={persona}
              onAgregarRecordatorio={onAgregarRecordatorio}
              onEliminarRecordatorio={onEliminarRecordatorio}
              onEliminarSesion={onEliminarSesion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
