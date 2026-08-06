import { useState } from "react";
import { Check, X, HelpCircle, AlertTriangle } from "lucide-react";
import { formatearFechaAR } from "../../../../components/form/formatear_fecha.js";

const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIA_LABEL = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};

function fechaCorta(fecha) {
  return formatearFechaAR(fecha).slice(0, 5); // DD/MM
}

// Filas: rutina configurada, agrupada por día — más un grupo "Otros" con
// filas sin día asignado Y con cualquier ejercicio que aparezca en las
// sesiones reales pero no esté en la rutina (nunca se esconde un dato real).
// Columnas: fechas distintas de las sesiones. Celda: lista de entradas
// {sesion, sesionEjercicio} para ese (ejercicio, fecha) — puede haber más
// de una si hubo dos visitas el mismo día.
function armarMatriz(ficha) {
  const rutina = ficha?.rutina || [];
  const sesiones = ficha?.sesiones || [];

  const idsEnRutina = new Set(rutina.map((r) => r.ejercicio_id));
  const nombresExtra = new Map();
  for (const sesion of sesiones) {
    for (const se of sesion.ejercicios || []) {
      if (se.ejercicio_id && !idsEnRutina.has(se.ejercicio_id) && !nombresExtra.has(se.ejercicio_id)) {
        nombresExtra.set(se.ejercicio_id, se.ejercicio?.nombre ?? "Ejercicio");
      }
    }
  }

  const grupos = new Map(ORDEN_DIAS.map((d) => [d, []]));
  grupos.set("otros", []);

  for (const r of rutina) {
    const dia = r.dia_semana && ORDEN_DIAS.includes(r.dia_semana) ? r.dia_semana : "otros";
    grupos.get(dia).push({ ejercicio_id: r.ejercicio_id, nombre: r.ejercicio?.nombre ?? "Ejercicio" });
  }
  for (const [ejercicio_id, nombre] of nombresExtra) {
    grupos.get("otros").push({ ejercicio_id, nombre });
  }

  const filas = [...ORDEN_DIAS, "otros"]
    .filter((d) => grupos.get(d).length > 0)
    .map((d) => ({ dia: d, ejercicios: grupos.get(d) }));

  const columnas = [...new Set(sesiones.map((s) => s.fecha))];

  const celdas = new Map();
  for (const sesion of sesiones) {
    for (const se of sesion.ejercicios || []) {
      if (!se.ejercicio_id) continue;
      const key = `${se.ejercicio_id}|${sesion.fecha}`;
      if (!celdas.has(key)) celdas.set(key, []);
      celdas.get(key).push({ sesion, sesionEjercicio: se });
    }
  }

  return { filas, columnas, celdas };
}

// Escala clínica estándar de dolor (0-10): 0-3 leve, 4-6 moderado, 7-10 alto.
function estadoCelda(entradas) {
  if (!entradas?.length) return "vacio";
  const maxDolor = Math.max(...entradas.map((e) => Number(e.sesion.dolor_durante) || 0));
  if (maxDolor <= 3) return "verde";
  if (maxDolor <= 6) return "amarillo";
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
    ? `${entradas.length} sesión${entradas.length > 1 ? "es" : ""} — click para ver el detalle`
    : "Sin sesión registrada — click para registrar";
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className="h-9 w-full cursor-pointer rounded-md border transition hover:brightness-95"
      style={{ background: estilo.bg, borderColor: estilo.border }}
    >
      {estado === "vacio" && <HelpCircle size={13} className="mx-auto text-slate-400" />}
      {estado === "verde" && <Check size={13} className="mx-auto text-(--kt-success)" />}
      {estado === "amarillo" && <AlertTriangle size={12} className="mx-auto text-(--kt-warning)" />}
      {estado === "rojo" && <X size={13} className="mx-auto text-(--kt-danger)" />}
    </button>
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

function DetalleCeldaModal({ nombreEjercicio, fecha, entradas, onClose, onEditarSesion }) {
  return (
    <div className="fixed inset-0 z-(--z-modal-nested) flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{nombreEjercicio}</h3>
            <p className="text-xs text-slate-500">{formatearFechaAR(fecha)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {entradas.map(({ sesion, sesionEjercicio: se }, i) => (
            <div key={se.id} className={i > 0 ? "border-t border-slate-100 pt-4" : ""}>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
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

              <button
                type="button"
                onClick={() => onEditarSesion(sesion)}
                className="mt-3 text-xs font-semibold text-(--kt-teal-700) hover:underline"
              >
                Editar esta sesión
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RutinaMatriz({ ficha, onEditarSesion, onRegistrarEjercicio }) {
  const [celdaAbierta, setCeldaAbierta] = useState(null); // { nombre, fecha, entradas }

  const { filas, columnas, celdas } = armarMatriz(ficha);

  if (!filas.length) {
    return <p className="text-sm text-slate-400">Todavía no configuraste una rutina para este paciente.</p>;
  }

  if (!columnas.length) {
    return (
      <div>
        <p className="text-sm text-slate-400 mb-2">Rutina configurada, sin sesiones registradas todavía. Click en un ejercicio para registrar la primera sesión.</p>
        <ul className="space-y-1">
          {filas.flatMap((f) => f.ejercicios).map((ej) => (
            <li key={ej.ejercicio_id}>
              <button
                type="button"
                onClick={() => onRegistrarEjercicio({ ejercicio_id: ej.ejercicio_id, nombre: ej.nombre })}
                className="w-full rounded-lg bg-slate-50 px-3 py-1.5 text-left text-sm text-slate-600 transition hover:bg-slate-100"
              >
                {ej.nombre}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: `${180 + columnas.length * 64}px` }}>
          {/* header de fechas */}
          <div className="grid mb-1" style={{ gridTemplateColumns: `180px repeat(${columnas.length}, 64px)` }}>
            <div />
            {columnas.map((f) => (
              <div key={f} className="text-center text-[10px] font-bold text-slate-400 pb-1">{fechaCorta(f)}</div>
            ))}
          </div>

          {/* filas agrupadas por día */}
          <div className="space-y-2.5">
            {filas.map(({ dia, ejercicios }) => (
              <div key={dia}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-(--kt-teal-700)">
                  {dia === "otros" ? "Otros" : DIA_LABEL[dia]}
                </p>
                <div className="space-y-1">
                  {ejercicios.map((ej) => (
                    <div key={ej.ejercicio_id} className="grid items-center gap-1" style={{ gridTemplateColumns: `180px repeat(${columnas.length}, 64px)` }}>
                      <div className="truncate pr-2 text-xs font-semibold text-slate-700" title={ej.nombre}>{ej.nombre}</div>
                      {columnas.map((f) => {
                        const entradas = celdas.get(`${ej.ejercicio_id}|${f}`) || [];
                        return (
                          <Celda
                            key={f}
                            entradas={entradas}
                            onClick={() => entradas.length
                              ? setCeldaAbierta({ nombre: ej.nombre, fecha: f, entradas })
                              : onRegistrarEjercicio({ ejercicio_id: ej.ejercicio_id, nombre: ej.nombre })}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.vacio.bg, borderColor: ESTILO_ESTADO.vacio.border }} /> Sin sesión (click para registrar)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.verde.bg, borderColor: ESTILO_ESTADO.verde.border }} /> Dolor 0-3</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.amarillo.bg, borderColor: ESTILO_ESTADO.amarillo.border }} /> Dolor 4-6</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: ESTILO_ESTADO.rojo.bg, borderColor: ESTILO_ESTADO.rojo.border }} /> Dolor 7-10</span>
      </div>

      {celdaAbierta && (
        <DetalleCeldaModal
          nombreEjercicio={celdaAbierta.nombre}
          fecha={celdaAbierta.fecha}
          entradas={celdaAbierta.entradas}
          onClose={() => setCeldaAbierta(null)}
          onEditarSesion={(sesion) => { setCeldaAbierta(null); onEditarSesion(sesion); }}
        />
      )}
    </div>
  );
}
