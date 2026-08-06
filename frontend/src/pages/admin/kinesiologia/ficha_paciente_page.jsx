import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HeartPulse, ArrowLeft, Plus, ClipboardList, Dumbbell, Activity, Edit2, Trash2, CalendarDays } from "lucide-react";
import { getDetallePacienteKinesiologia, guardarRutinaKinesiologia, eliminarSesionKinesiologia } from "../../../api/kinesiologia_api.js";
import { formatearFechaAR } from "../../../components/form/formatear_fecha";
import { useCatalogos } from "../../../hooks/use_catalogos.js";
import RutinaMatriz from "./components/rutina_matriz.jsx";
import RutinaKinesiologiaModal from "../../../components/modal/rutina_kinesiologia_modal.jsx";

function EscalaBadge({ label, valor }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-800">{valor}/5</span>
    </div>
  );
}

function EjerciciosSesionList({ ejercicios }) {
  if (!ejercicios?.length) return null;
  return (
    <ul className="mt-1.5 space-y-1">
      {ejercicios.map((ej) => (
        <li key={ej.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
          <span className="text-slate-700">{ej.ejercicio?.nombre ?? "Ejercicio"}</span>
          <span className="text-slate-500">
            {[
              ej.peso ? `${ej.peso}kg` : null,
              ej.series ? `${ej.series}s` : null,
              ej.repeticiones ? `${ej.repeticiones}r` : null,
              ej.rir != null ? `RIR ${ej.rir}` : null,
            ].filter(Boolean).join(" · ") || "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SesionRow({ sesion, onEditar, onEliminar }) {
  const dolorOk = sesion.dolor_durante <= 3;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-800">{formatearFechaAR(sesion.fecha)}</span>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sesion.apto_para_subir_carga ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            {sesion.apto_para_subir_carga ? "Apto para subir carga" : "Mantener carga"}
          </span>
          <button
            type="button"
            onClick={() => onEditar(sesion)}
            title="Editar sesión"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-(--kt-teal-700)"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => onEliminar(sesion)}
            title="Eliminar sesión"
            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <EjerciciosSesionList ejercicios={sesion.ejercicios} />
      <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <EscalaBadge label="Movimiento" valor={sesion.calidad_movimiento} />
        <EscalaBadge label="Tolerancia" valor={sesion.tolerancia_carga} />
        <EscalaBadge label="Confianza" valor={sesion.confianza_paciente} />
        <EscalaBadge label="Cumplimiento" valor={sesion.cumplimiento_programa} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${dolorOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          Dolor durante: {sesion.dolor_durante}/10
        </span>
        {sesion.dolor_24h != null && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">Dolor 24h: {sesion.dolor_24h}/10</span>
        )}
      </div>
      {sesion.observaciones && <p className="mt-2 text-xs text-slate-500">{sesion.observaciones}</p>}
    </div>
  );
}

function FichaCard({ patologia, pacienteKinesiologiaId, ejerciciosCatalogo, onRutinaGuardada }) {
  const nav = useNavigate();
  const ficha = patologia.ficha;
  const [rutinaModalAbierto, setRutinaModalAbierto] = useState(false);
  const [guardandoRutina, setGuardandoRutina] = useState(false);

  function editarSesion(sesion) {
    nav(`/admin/kinesiologia/${pacienteKinesiologiaId}/sesion?ficha=${ficha.id}`, {
      state: { sesionEditar: sesion },
    });
  }

  async function eliminarSesion(sesion) {
    if (!window.confirm(`¿Eliminar la sesión del ${formatearFechaAR(sesion.fecha)}? Esta acción no se puede deshacer.`)) return;
    const r = await eliminarSesionKinesiologia(sesion.id);
    if (r.ok) await onRutinaGuardada?.();
  }

  function registrarEjercicio(ejercicio) {
    nav(`/admin/kinesiologia/${pacienteKinesiologiaId}/sesion?ficha=${ficha.id}`, {
      state: { ejercicioPrecargado: ejercicio },
    });
  }

  async function guardarRutina(items) {
    setGuardandoRutina(true);
    try {
      const r = await guardarRutinaKinesiologia(ficha.id, items);
      if (r.ok) {
        setRutinaModalAbierto(false);
        await onRutinaGuardada?.();
      }
    } finally {
      setGuardandoRutina(false);
    }
  }

  const ultimaSesion = ficha?.sesiones?.length ? ficha.sesiones[ficha.sesiones.length - 1] : null;

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
        <>
          {/* Evaluación inicial */}
          {(ficha.tests_funcionales?.length > 0 || ficha.tests_fuerza?.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {ficha.tests_funcionales?.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Activity size={13} /> Test funcional
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {ficha.tests_funcionales.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-700">{t.ejercicio?.nombre}</span>
                        <span className="font-bold text-slate-900">{t.calidad_movimiento}/5</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ficha.tests_fuerza?.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Dumbbell size={13} /> Test de fuerza
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {ficha.tests_fuerza.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-700">{t.ejercicio?.nombre}</span>
                        <span className="font-bold text-slate-900">{t.peso}kg × {t.repeticiones}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Última sesión + matriz de cumplimiento */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <ClipboardList size={13} /> Seguimiento
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRutinaModalAbierto(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-(--kt-teal-700)/25 bg-(--kt-teal-700)/10 px-2.5 py-1 text-[11px] font-bold text-(--kt-teal-700) hover:bg-(--kt-teal-700)/15"
                >
                  <CalendarDays size={12} /> Configurar rutina
                </button>
                <Link
                  to={`/admin/kinesiologia/${pacienteKinesiologiaId}/sesion?ficha=${ficha.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-(--kt-teal-700) px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90"
                >
                  <Plus size={12} /> Registrar sesión
                </Link>
              </div>
            </div>

            {!ficha.sesiones?.length && !ficha.rutina?.length ? (
              <p className="text-sm text-slate-400">Todavía no hay rutina ni sesiones registradas.</p>
            ) : (
              <div className="space-y-3">
                {ultimaSesion && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Última sesión</p>
                    <SesionRow sesion={ultimaSesion} onEditar={editarSesion} onEliminar={eliminarSesion} />
                  </div>
                )}
                <RutinaMatriz ficha={ficha} onEditarSesion={editarSesion} onRegistrarEjercicio={registrarEjercicio} onEliminarSesion={eliminarSesion} />
              </div>
            )}
          </div>
        </>
      )}

      <RutinaKinesiologiaModal
        abierto={rutinaModalAbierto}
        onClose={() => setRutinaModalAbierto(false)}
        onGuardar={guardarRutina}
        rutinaActual={ficha?.rutina || []}
        ejerciciosCatalogo={ejerciciosCatalogo}
        cargando={guardandoRutina}
      />
    </div>
  );
}

export default function FichaPacientePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: catalogos } = useCatalogos();

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
                pacienteKinesiologiaId={data.paciente_kinesiologia_id}
                ejerciciosCatalogo={catalogos?.ejerciciosKinesiologia || []}
                onRutinaGuardada={cargar}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
