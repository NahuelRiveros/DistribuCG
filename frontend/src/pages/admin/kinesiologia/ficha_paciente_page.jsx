import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeartPulse, ArrowLeft, ClipboardList } from "lucide-react";
import {
  getDetallePacienteKinesiologia,
  registrarSesionKinesiologia,
  eliminarSesionKinesiologia,
  agregarRecordatorioKinesiologia,
  eliminarRecordatorioKinesiologia,
} from "../../../api/kinesiologia_api.js";
import SesionesFicha from "./components/sesiones_ficha.jsx";

function FichaCard({ patologia, persona, onCambio }) {
  const ficha = patologia.ficha;

  async function crearSesion(payload) {
    const r = await registrarSesionKinesiologia(ficha.id, payload);
    if (r.ok) await onCambio?.();
    return r;
  }

  async function eliminarSesion(id) {
    const r = await eliminarSesionKinesiologia(id);
    if (r.ok) await onCambio?.();
  }

  async function agregarRecordatorio(sesionId, payload) {
    const r = await agregarRecordatorioKinesiologia(sesionId, payload);
    if (r.ok) await onCambio?.();
    return r;
  }

  async function eliminarRecordatorio(id) {
    const r = await eliminarRecordatorioKinesiologia(id);
    if (r.ok) await onCambio?.();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full border border-(--kt-teal-700)/25 bg-(--kt-teal-700)/10 px-2.5 py-0.5 text-[11px] font-bold text-(--kt-teal-700)">
            {patologia.patologia?.descripcion}
          </span>
          {ficha && (
            <p className="mt-2 text-sm text-slate-700">{ficha.objetivo}</p>
          )}
        </div>
        {ficha && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ficha.estado === "activa" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            {ficha.estado === "activa" ? "Ficha activa" : "Ficha cerrada"}
          </span>
        )}
      </div>

      {!ficha ? (
        <p className="text-sm text-slate-400">Esta patología todavía no tiene ficha de seguimiento.</p>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <ClipboardList size={13} /> Sesiones
          </div>
          <SesionesFicha
            sesiones={ficha.sesiones || []}
            persona={persona}
            onCrearSesion={crearSesion}
            onEliminarSesion={eliminarSesion}
            onAgregarRecordatorio={agregarRecordatorio}
            onEliminarRecordatorio={eliminarRecordatorio}
          />
        </div>
      )}
    </div>
  );
}

export default function FichaPacientePage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    try {
      const r = await getDetallePacienteKinesiologia(id);
      if (!r.ok) { setError(r.mensaje || "No se pudo cargar el paciente"); return; }
      setData(r);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.mensaje || "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando) {
    return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-400">Cargando…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const persona = data.persona;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        <button
          type="button"
          onClick={() => nav("/admin/kinesiologia")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={15} /> Volver al listado
        </button>

        <div className="overflow-hidden rounded-2xl border border-[var(--kt-turquoise-border)] bg-white shadow-sm">
          <div className="h-1 w-full bg-linear-to-r from-(--kt-teal-700) via-[var(--kt-petrol)] to-[var(--kt-turquoise)]" />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--kt-teal-700) text-white">
              <HeartPulse size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{persona.apellido} {persona.nombre}</h1>
              <p className="text-sm text-slate-500">DNI {persona.documento}{persona.celular ? ` · ${persona.celular}` : ""}</p>
            </div>
          </div>
        </div>

        {!data.patologias?.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Este paciente todavía no tiene patologías cargadas.
          </div>
        ) : (
          <div className="space-y-4">
            {data.patologias.map((p) => (
              <FichaCard
                key={p.id}
                patologia={p}
                persona={persona}
                onCambio={cargar}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
