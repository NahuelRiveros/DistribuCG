import { useState } from "react";
import { X, Plus } from "lucide-react";
import { formatearFechaAR } from "../../../utils/formatear_fecha.js";
import { ORDEN_DIAS, DIA_LABEL, diaSemanaDeFecha } from "../dias_semana.js";

// Secciones: una por cada día de la semana que tenga algo para mostrar.
// Filas dentro de un día: los ejercicios de la rutina configurados para ese
// día (o para todos, si es una rutina vieja sin días asignados), más
// cualquier sesión real que haya caído en ese día — sea de un ejercicio
// fuera de la rutina, o de uno que está en la rutina pero programado para
// otro día (el paciente lo hizo igual ese día). Nunca se esconde un dato
// real cargado, aunque no coincida con lo planificado. Cada fila junta
// TODAS las sesiones reales de ese ejercicio que cayeron en ese día de la
// semana, sin importar la fecha exacta ni la semana — la celda se pinta
// según la sesión más reciente de esa lista.
function armarSecciones(ficha) {
  const rutina = ficha?.rutina || [];
  const sesiones = ficha?.sesiones || [];

  const celdas = new Map();
  const nombresPorEjercicio = new Map();
  for (const sesion of sesiones) {
    const dia = diaSemanaDeFecha(sesion.fecha);
    for (const se of sesion.ejercicios || []) {
      if (!se.ejercicio_id) continue;
      const key = `${se.ejercicio_id}|${dia}`;
      if (!celdas.has(key)) celdas.set(key, []);
      celdas.get(key).push({ sesion, sesionEjercicio: se });
      if (!nombresPorEjercicio.has(se.ejercicio_id)) {
        nombresPorEjercicio.set(se.ejercicio_id, se.ejercicio?.nombre ?? "Ejercicio");
      }
    }
  }
  // más reciente primero, así entradas[0] es "la última vez"
  for (const arr of celdas.values()) {
    arr.sort((a, b) => (a.sesion.fecha < b.sesion.fecha ? 1 : a.sesion.fecha > b.sesion.fecha ? -1 : 0));
  }

  const secciones = [];
  for (const dia of ORDEN_DIAS) {
    const filas = [];
    const vistosEnDia = new Set();
    for (const r of rutina) {
      const dias = r.dias?.length ? r.dias : ORDEN_DIAS;
      if (!dias.includes(dia)) continue;
      vistosEnDia.add(r.ejercicio_id);
      filas.push({
        ejercicio_id: r.ejercicio_id,
        nombre: r.ejercicio?.nombre ?? "Ejercicio",
        entradas: celdas.get(`${r.ejercicio_id}|${dia}`) || [],
      });
    }
    for (const [ejercicio_id, nombre] of nombresPorEjercicio) {
      if (vistosEnDia.has(ejercicio_id)) continue;
      const entradas = celdas.get(`${ejercicio_id}|${dia}`) || [];
      if (!entradas.length) continue; // solo se agregan días donde realmente hubo sesión
      filas.push({ ejercicio_id, nombre, entradas });
    }
    if (filas.length) secciones.push({ dia, filas });
  }

  return secciones;
}

// Escala clínica estándar de dolor (0-10): 0-3 leve, 4-6 moderado, 7-10 alto.
// Se toma la sesión más reciente de la celda (entradas ya vienen ordenadas).
function estadoCelda(entradas) {
  if (!entradas?.length) return "vacio";
  const dolor = Number(entradas[0].sesion.dolor_durante) || 0;
  if (dolor <= 3) return "verde";
  if (dolor <= 6) return "amarillo";
  return "rojo";
}

const ESTILO_ESTADO = {
  vacio:    { bg: "var(--color-neutral-50)", border: "var(--color-neutral-200)" },
  verde:    { bg: "var(--kt-success-bg)",    border: "var(--kt-success)" },
  amarillo: { bg: "var(--kt-warning-bg)",    border: "var(--kt-warning)" },
  rojo:     { bg: "var(--kt-danger-bg)",     border: "var(--kt-danger)" },
};

function Celda({ entradas, onClick }) {
  const estado = estadoCelda(entradas);
  const estilo = ESTILO_ESTADO[estado];
  const titulo = entradas.length
    ? `${entradas.length} sesión${entradas.length > 1 ? "es" : ""} — la más reciente: ${formatearFechaAR(entradas[0].sesion.fecha)}. Click para ver el historial`
    : "Sin sesión registrada — click para ver y agregar una sesión";
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className="h-9 w-9 shrink-0 cursor-pointer rounded-md border transition hover:brightness-95"
      style={{ background: estilo.bg, borderColor: estilo.border }}
    />
  );
}

function EscalaMini({ label, valor }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-800">{valor}/5</span>
    </div>
  );
}

// Historial completo del ejercicio en ese día de la semana — puede haber
// varias entradas de semanas distintas, cada una con su fecha real, con
// resultados distintos según cómo vino evolucionando el paciente.
function DetalleCeldaModal({ nombreEjercicio, dia, entradas, onClose, onEditarSesion, onEliminarSesion, onRegistrarSesion }) {
  return (
    <div className="fixed inset-0 z-(--z-modal-nested) flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{nombreEjercicio}</h3>
            <p className="text-xs text-slate-500">
              {DIA_LABEL[dia]} — {entradas.length ? `${entradas.length} sesión${entradas.length > 1 ? "es" : ""}` : "sin sesiones todavía"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!entradas.length && (
            <p className="text-sm text-slate-400">Todavía no se registró ninguna sesión de este ejercicio en este día.</p>
          )}

          <button
            type="button"
            onClick={onRegistrarSesion}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-(--kt-teal-700) py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            <Plus size={14} /> Agregar sesión
          </button>

          {entradas.map(({ sesion, sesionEjercicio: se }) => (
            <div key={se.id} className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-(--kt-teal-700)">{formatearFechaAR(sesion.fecha)}</p>

              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                {se.peso != null && <span className="rounded-full bg-slate-100 px-2 py-0.5">{se.peso}kg</span>}
                {se.series != null && <span className="rounded-full bg-slate-100 px-2 py-0.5">{se.series} series</span>}
                {se.repeticiones != null && <span className="rounded-full bg-slate-100 px-2 py-0.5">{se.repeticiones} reps</span>}
                {se.rir != null && <span className="rounded-full bg-slate-100 px-2 py-0.5">RIR {se.rir}</span>}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <EscalaMini label="Movimiento" valor={sesion.calidad_movimiento} />
                <EscalaMini label="Tolerancia" valor={sesion.tolerancia_carga} />
                <EscalaMini label="Confianza" valor={sesion.confianza_paciente} />
                <EscalaMini label="Cumplimiento" valor={sesion.cumplimiento_programa} />
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${sesion.dolor_durante <= 3 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  Dolor: {sesion.dolor_durante}/10
                </span>
                <span className={`rounded-full border px-2 py-0.5 font-bold ${sesion.apto_para_subir_carga ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  {sesion.apto_para_subir_carga ? "Apto para subir carga" : "Mantener carga"}
                </span>
              </div>

              {sesion.observaciones && <p className="mt-2 text-xs text-slate-500">{sesion.observaciones}</p>}

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEditarSesion(sesion)}
                  className="text-xs font-semibold text-(--kt-teal-700) hover:underline"
                >
                  Editar esta sesión
                </button>
                <button
                  type="button"
                  onClick={() => onEliminarSesion(sesion)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Eliminar esta sesión
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RutinaMatriz({ ficha, onEditarSesion, onRegistrarEjercicio, onEliminarSesion }) {
  const [celdaAbierta, setCeldaAbierta] = useState(null); // { nombre, dia, entradas }

  const secciones = armarSecciones(ficha);

  if (!secciones.length) {
    return <p className="text-sm text-slate-400">Todavía no configuraste una rutina para este paciente.</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        {secciones.map(({ dia, filas }) => (
          <div key={dia}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{DIA_LABEL[dia]}</p>
            <div className="space-y-1">
              {filas.map((fila) => (
                <div key={fila.ejercicio_id} className="flex items-center gap-2">
                  <Celda
                    entradas={fila.entradas}
                    onClick={() => setCeldaAbierta({ ejercicio_id: fila.ejercicio_id, nombre: fila.nombre, dia, entradas: fila.entradas })}
                  />
                  <span className="truncate text-xs font-semibold text-slate-700" title={fila.nombre}>{fila.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.vacio.bg, borderColor: ESTILO_ESTADO.vacio.border }} /> Sin sesión (click para ver y agregar)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.verde.bg, borderColor: ESTILO_ESTADO.verde.border }} /> Dolor 0-3</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.amarillo.bg, borderColor: ESTILO_ESTADO.amarillo.border }} /> Dolor 4-6</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.rojo.bg, borderColor: ESTILO_ESTADO.rojo.border }} /> Dolor 7-10</span>
      </div>

      {celdaAbierta && (
        <DetalleCeldaModal
          nombreEjercicio={celdaAbierta.nombre}
          dia={celdaAbierta.dia}
          entradas={celdaAbierta.entradas}
          onClose={() => setCeldaAbierta(null)}
          onEditarSesion={(sesion) => { setCeldaAbierta(null); onEditarSesion(sesion); }}
          onEliminarSesion={(sesion) => { setCeldaAbierta(null); onEliminarSesion(sesion); }}
          onRegistrarSesion={() => { setCeldaAbierta(null); onRegistrarEjercicio({ ejercicio_id: celdaAbierta.ejercicio_id, nombre: celdaAbierta.nombre, dia: celdaAbierta.dia }); }}
        />
      )}
    </div>
  );
}
