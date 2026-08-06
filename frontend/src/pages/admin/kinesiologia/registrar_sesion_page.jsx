import { useState } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { registrarSesionKinesiologia, actualizarSesionKinesiologia } from "../../../api/kinesiologia_api.js";
import { useCatalogos } from "../../../hooks/use_catalogos.js";
import { agruparEjerciciosPorZona } from "../../../utils/kinesiologia_zonas.js";

const ESCALAS = [
  { key: "calidad_movimiento",   label: "Calidad del movimiento" },
  { key: "tolerancia_carga",     label: "Tolerancia a la carga" },
  { key: "confianza_paciente",   label: "Confianza del paciente" },
  { key: "cumplimiento_programa", label: "Cumplimiento del programa" },
];

const CRITERIOS = [
  { key: "tecnica_correcta",   label: "Técnica correcta" },
  { key: "sin_compensaciones", label: "Sin compensaciones" },
  { key: "buena_recuperacion", label: "Buena recuperación" },
];

function SelectorZonaEjercicio({ zona, opciones, onAgregar }) {
  const [ejercicioId, setEjercicioId] = useState("");
  const [peso, setPeso] = useState("");
  const [series, setSeries] = useState("");
  const [repeticiones, setRepeticiones] = useState("");
  const [rir, setRir] = useState("");

  function agregar() {
    if (!ejercicioId) return;
    const opcion = opciones.find((op) => String(op.value) === String(ejercicioId));
    onAgregar({
      ejercicio_id: Number(ejercicioId),
      nombre: opcion?.label ?? "",
      peso: peso || null,
      series: series || null,
      repeticiones: repeticiones || null,
      rir: rir === "" ? null : Number(rir),
    });
    setEjercicioId(""); setPeso(""); setSeries(""); setRepeticiones(""); setRir("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{zona}</p>

      <select
        value={ejercicioId}
        onChange={(e) => setEjercicioId(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-(--kt-teal-700)"
      >
        <option value="">Elegir ejercicio…</option>
        {opciones.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}{op.grupo_muscular ? ` (${op.grupo_muscular})` : ""}
          </option>
        ))}
      </select>

      {ejercicioId && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            <input value={peso} onChange={(e) => setPeso(e.target.value)} inputMode="decimal" placeholder="Peso" className="rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:border-(--kt-teal-700)" />
            <input value={series} onChange={(e) => setSeries(e.target.value)} inputMode="numeric" placeholder="Series" className="rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:border-(--kt-teal-700)" />
            <input value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)} inputMode="numeric" placeholder="Reps" className="rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:border-(--kt-teal-700)" />
            <input value={rir} onChange={(e) => setRir(e.target.value)} inputMode="numeric" placeholder="RIR" className="rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:border-(--kt-teal-700)" />
          </div>
          <button
            type="button"
            onClick={agregar}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-(--kt-teal-700) py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            <Plus size={13} /> Agregar a la sesión
          </button>
        </>
      )}
    </div>
  );
}

function EscalaSelector({ label, valor, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="mt-1.5 grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-11 rounded-xl border text-sm font-bold transition ${
              valor === n
                ? "border-(--kt-teal-700) bg-(--kt-teal-700) text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-(--kt-teal-700)/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function EscalaDolor({ label, valor, onChange, opcional = false }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}{opcional && <span className="ml-1 font-normal text-slate-400">(opcional)</span>}</p>
      <div className="mt-1.5 grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, n) => n).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-9 rounded-lg border text-xs font-bold transition ${
              valor === n
                ? n <= 3 ? "border-emerald-600 bg-emerald-600 text-white" : "border-red-600 bg-red-600 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RegistrarSesionKinesiologiaPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fichaId = searchParams.get("ficha");
  const nav = useNavigate();
  const location = useLocation();

  const sesionEditar = location.state?.sesionEditar ?? null;
  const ejercicioPrecargado = location.state?.ejercicioPrecargado ?? null;
  const esEdicion = Boolean(sesionEditar);

  const { data: catalogos } = useCatalogos();
  const gruposEjercicios = agruparEjerciciosPorZona(catalogos?.ejerciciosKinesiologia || []);

  const [ejerciciosSesion, setEjerciciosSesion] = useState(() => {
    if (sesionEditar?.ejercicios) {
      return sesionEditar.ejercicios.map((e) => ({
        ejercicio_id: e.ejercicio_id,
        nombre: e.ejercicio?.nombre ?? "",
        peso: e.peso ?? null,
        series: e.series ?? null,
        repeticiones: e.repeticiones ?? null,
        rir: e.rir ?? null,
      }));
    }
    if (ejercicioPrecargado) {
      return [{
        ejercicio_id: ejercicioPrecargado.ejercicio_id,
        nombre: ejercicioPrecargado.nombre ?? "",
        peso: null, series: null, repeticiones: null, rir: null,
      }];
    }
    return [];
  });
  const [dolorDurante, setDolorDurante] = useState(sesionEditar?.dolor_durante ?? null);
  const [dolor24h, setDolor24h] = useState(sesionEditar?.dolor_24h ?? null);
  const [escalas, setEscalas] = useState({
    calidad_movimiento: sesionEditar?.calidad_movimiento ?? null,
    tolerancia_carga: sesionEditar?.tolerancia_carga ?? null,
    confianza_paciente: sesionEditar?.confianza_paciente ?? null,
    cumplimiento_programa: sesionEditar?.cumplimiento_programa ?? null,
  });
  const [criterios, setCriterios] = useState({
    tecnica_correcta: sesionEditar?.tecnica_correcta ?? false,
    sin_compensaciones: sesionEditar?.sin_compensaciones ?? false,
    buena_recuperacion: sesionEditar?.buena_recuperacion ?? false,
  });
  const [aptoManual, setAptoManual] = useState(sesionEditar ? sesionEditar.apto_para_subir_carga : null);
  const [observaciones, setObservaciones] = useState(sesionEditar?.observaciones ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const rirCargados = ejerciciosSesion.map((e) => e.rir).filter((v) => v != null);
  const rirMinimo = rirCargados.length ? Math.min(...rirCargados) : null;
  const sugerenciaApto = dolorDurante != null && dolorDurante <= 3 && (rirMinimo == null || rirMinimo >= 2);
  const aptoFinal = aptoManual !== null ? aptoManual : sugerenciaApto;

  const faltanCampos =
    dolorDurante == null ||
    Object.values(escalas).some((v) => v == null);

  function agregarEjercicio(item) {
    setEjerciciosSesion((lista) => [...lista, item]);
  }

  function quitarEjercicio(index) {
    setEjerciciosSesion((lista) => lista.filter((_, i) => i !== index));
  }

  async function guardar() {
    if (faltanCampos) {
      setError("Completá el dolor durante el ejercicio y los 4 indicadores de progresión");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const payload = {
        ejercicios: ejerciciosSesion.map((ej) => ({
          ejercicio_id: ej.ejercicio_id,
          peso: ej.peso,
          series: ej.series,
          repeticiones: ej.repeticiones,
          rir: ej.rir,
        })),
        dolor_durante: dolorDurante,
        dolor_24h: dolor24h,
        ...escalas,
        ...criterios,
        apto_para_subir_carga: aptoFinal,
        observaciones: observaciones || null,
      };
      const r = esEdicion
        ? await actualizarSesionKinesiologia(sesionEditar.id, payload)
        : await registrarSesionKinesiologia(fichaId, payload);
      if (!r.ok) { setError(r.mensaje || "No se pudo guardar la sesión"); return; }
      nav(`/admin/kinesiologia/${id}`);
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo guardar la sesión");
    } finally {
      setGuardando(false);
    }
  }

  if (!fichaId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-sm text-red-600">
        Falta indicar la ficha (parámetro ?ficha= en la URL). Volvé a la ficha del paciente y usá el botón "Registrar sesión".
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-lg space-y-5 p-4 sm:p-6">

        <button
          type="button"
          onClick={() => nav(`/admin/kinesiologia/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={15} /> Volver a la ficha
        </button>

        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{esEdicion ? "Editar sesión" : "Registrar sesión"}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {esEdicion ? "Corregí los datos de esta sesión ya guardada." : "Cargá los indicadores de progresión de hoy."}
          </p>
        </div>

        {/* Ejercicios de la sesión — de a uno por zona, se pueden agregar varios */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ejercicios trabajados (opcional)</p>

          {gruposEjercicios.map(({ zona, ejercicios }) => (
            <SelectorZonaEjercicio key={zona} zona={zona} opciones={ejercicios} onAgregar={agregarEjercicio} />
          ))}

          {ejerciciosSesion.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {ejerciciosSesion.map((ej, i) => (
                <li key={`${ej.ejercicio_id}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-emerald-800">{ej.nombre}</p>
                    <p className="text-emerald-600">
                      {[
                        ej.peso ? `${ej.peso}kg` : null,
                        ej.series ? `${ej.series} series` : null,
                        ej.repeticiones ? `${ej.repeticiones} reps` : null,
                        ej.rir != null ? `RIR ${ej.rir}` : null,
                      ].filter(Boolean).join(" · ") || "sin detalle de carga"}
                    </p>
                  </div>
                  <button type="button" onClick={() => quitarEjercicio(i)} className="shrink-0 rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-100">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dolor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <EscalaDolor label="Dolor durante el ejercicio (0–10)" valor={dolorDurante} onChange={setDolorDurante} />
          <EscalaDolor label="Dolor a las 24 h (de la sesión anterior)" valor={dolor24h} onChange={setDolor24h} opcional />
        </div>

        {/* Indicadores de progresión */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Indicadores de progresión</p>
          {ESCALAS.map(({ key, label }) => (
            <EscalaSelector key={key} label={label} valor={escalas[key]} onChange={(v) => setEscalas((s) => ({ ...s, [key]: v }))} />
          ))}
        </div>

        {/* Criterios de carga */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Criterios para aumentar la carga</p>
          {CRITERIOS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCriterios((c) => ({ ...c, [key]: !c[key] }))}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${
                criterios[key] ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {label}
              {criterios[key] && <Check size={16} />}
            </button>
          ))}

          <div className={`mt-2 rounded-xl border px-3.5 py-3 text-sm ${sugerenciaApto ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            Sugerencia según dolor ≤3/10 y RIR≥2: <strong>{sugerenciaApto ? "apto para subir carga" : "mantener carga"}</strong>
          </div>

          <button
            type="button"
            onClick={() => setAptoManual(!aptoFinal)}
            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-bold transition ${
              aptoFinal ? "border-(--kt-teal-700) bg-(--kt-teal-700) text-white" : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            Decisión final: {aptoFinal ? "Apto para subir carga" : "Mantener carga"}
            <Check size={16} className={aptoFinal ? "opacity-100" : "opacity-0"} />
          </button>
        </div>

        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          placeholder="Observaciones (opcional)"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-(--kt-teal-700)"
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-full rounded-xl bg-(--kt-teal-700) py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Guardar sesión"}
        </button>
      </div>
    </div>
  );
}
