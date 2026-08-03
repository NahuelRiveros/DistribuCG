import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { registrarSesionKinesiologia } from "../../../api/kinesiologia_api.js";
import { useCatalogos } from "../../../hooks/use_catalogos.js";

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

  const { data: catalogos } = useCatalogos();

  const [ejercicioId, setEjercicioId] = useState("");
  const [peso, setPeso] = useState("");
  const [series, setSeries] = useState("");
  const [repeticiones, setRepeticiones] = useState("");
  const [rir, setRir] = useState(null);
  const [dolorDurante, setDolorDurante] = useState(null);
  const [dolor24h, setDolor24h] = useState(null);
  const [escalas, setEscalas] = useState({ calidad_movimiento: null, tolerancia_carga: null, confianza_paciente: null, cumplimiento_programa: null });
  const [criterios, setCriterios] = useState({ tecnica_correcta: false, sin_compensaciones: false, buena_recuperacion: false });
  const [aptoManual, setAptoManual] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const sugerenciaApto = dolorDurante != null && dolorDurante <= 3 && (rir == null || rir >= 2);
  const aptoFinal = aptoManual !== null ? aptoManual : sugerenciaApto;

  const faltanCampos =
    dolorDurante == null ||
    Object.values(escalas).some((v) => v == null);

  async function guardar() {
    if (faltanCampos) {
      setError("Completá el dolor durante el ejercicio y los 4 indicadores de progresión");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const r = await registrarSesionKinesiologia(fichaId, {
        ejercicio_id: ejercicioId || null,
        peso: peso || null,
        series: series || null,
        repeticiones: repeticiones || null,
        rir,
        dolor_durante: dolorDurante,
        dolor_24h: dolor24h,
        ...escalas,
        ...criterios,
        apto_para_subir_carga: aptoFinal,
        observaciones: observaciones || null,
      });
      if (!r.ok) { setError(r.mensaje || "No se pudo registrar la sesión"); return; }
      nav(`/admin/kinesiologia/${id}`);
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo registrar la sesión");
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
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto w-full max-w-lg space-y-5 p-4 sm:p-6">

        <button
          type="button"
          onClick={() => nav(`/admin/kinesiologia/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={15} /> Volver a la ficha
        </button>

        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Registrar sesión</h1>
          <p className="mt-0.5 text-sm text-slate-500">Cargá los indicadores de progresión de hoy.</p>
        </div>

        {/* Ejercicio + carga */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <select
            value={ejercicioId}
            onChange={(e) => setEjercicioId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-(--kt-teal-700)"
          >
            <option value="">Ejercicio trabajado (opcional)</option>
            {(catalogos?.ejerciciosKinesiologia || []).map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input value={peso} onChange={(e) => setPeso(e.target.value)} inputMode="decimal" placeholder="Peso (kg)" className="rounded-xl border border-slate-300 px-2.5 py-2.5 text-sm outline-none focus:border-(--kt-teal-700)" />
            <input value={series} onChange={(e) => setSeries(e.target.value)} inputMode="numeric" placeholder="Series" className="rounded-xl border border-slate-300 px-2.5 py-2.5 text-sm outline-none focus:border-(--kt-teal-700)" />
            <input value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)} inputMode="numeric" placeholder="Reps" className="rounded-xl border border-slate-300 px-2.5 py-2.5 text-sm outline-none focus:border-(--kt-teal-700)" />
          </div>
        </div>

        {/* Dolor + RIR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <EscalaDolor label="Dolor durante el ejercicio (0–10)" valor={dolorDurante} onChange={setDolorDurante} />
          <EscalaDolor label="Dolor a las 24 h (de la sesión anterior)" valor={dolor24h} onChange={setDolor24h} opcional />
          <div>
            <p className="text-sm font-semibold text-slate-700">RIR (repeticiones en reserva)</p>
            <div className="mt-1.5 grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRir(n)}
                  className={`h-10 rounded-lg border text-sm font-bold transition ${rir === n ? "border-(--kt-teal-700) bg-(--kt-teal-700) text-white" : "border-slate-200 bg-white text-slate-500"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
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
      </div>

      {/* Barra de guardado fija — pensada para uso con una mano en tablet/celu */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="w-full rounded-xl bg-(--kt-teal-700) py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
