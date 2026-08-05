import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, UserPlus, HeartPulse, CheckCircle2, ArrowLeft, Check } from "lucide-react";
import InputField from "../../../components/form/input_field.jsx";
import DataGrid from "../../../components/table/DataGrid.jsx";
import { getPersonasRegistradas, agregarPacienteKinesiologia } from "../../../api/kinesiologia_api.js";
import { useCatalogos } from "../../../hooks/use_catalogos.js";

function iniciales(nombre, apellido) {
  const n = String(nombre || "").trim()[0] || "";
  const a = String(apellido || "").trim()[0] || "";
  return (a + n).toUpperCase() || "?";
}

const COLUMNAS_PERSONAS = [
  {
    key: "apellido",
    label: "Persona",
    searchable: true,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--kt-teal-700) text-[10px] font-extrabold text-white">
          {iniciales(row.nombre, row.apellido)}
        </div>
        <p className="font-semibold text-slate-900 leading-tight">{row.apellido} {row.nombre}</p>
      </div>
    ),
  },
  { key: "documento", label: "DNI", searchable: true, className: "text-slate-600" },
  {
    key: "_estado",
    label: "Estado",
    searchable: false,
    render: (row) => (
      <div className="flex flex-wrap gap-1.5">
        {row.es_alumno && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">Alumno</span>
        )}
        {row.ya_es_paciente_kinesiologia && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Ya es paciente</span>
        )}
      </div>
    ),
  },
];

export default function AgregarPacienteModal({ open, onClose, onCreado }) {
  const { data: catalogos } = useCatalogos();

  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [error, setError] = useState(null);
  const [persona, setPersona] = useState(null);

  const [patologiaIds, setPatologiaIds] = useState([]);
  const [fechaDiagnostico, setFechaDiagnostico] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar({ resetPage = false, qOverride } = {}) {
    const nextPage = resetPage ? 1 : page;
    const q = qOverride !== undefined ? qOverride : busqueda;
    setCargando(true);
    try {
      const r = await getPersonasRegistradas({
        page: nextPage, limit, sort: "apellido", order: "asc",
        ...(q?.trim() ? { q: q.trim() } : {}),
      });
      if (r?.ok) { setData(r); if (resetPage) setPage(1); }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (open && !persona) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, limit]);

  if (!open) return null;

  function resetear() {
    setBusqueda(""); setPage(1); setData(null); setPersona(null); setError(null);
    setPatologiaIds([]); setFechaDiagnostico(""); setFechaInicio(""); setObjetivo("");
  }

  function toggleActiva(id) {
    setPatologiaIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  function cerrar() {
    resetear();
    onClose();
  }

  function seleccionar(row) {
    setError(null);
    if (row.ya_es_paciente_kinesiologia) {
      setError("Esta persona ya es paciente de kinesiología. Podés cargarle una nueva patología desde su ficha, en el listado de pacientes.");
      return;
    }
    setPersona(row);
  }

  async function confirmar() {
    if (!patologiaIds.length || !objetivo.trim()) {
      setError("Elegí al menos una patología y cargá el objetivo del tratamiento");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const r = await agregarPacienteKinesiologia({
        persona_id: persona.persona_id,
        patologia_ids: patologiaIds,
        fecha_diagnostico: fechaDiagnostico || null,
        fecha_inicio: fechaInicio || null,
        objetivo: objetivo.trim(),
      });
      if (!r.ok) { setError(r.mensaje || "No se pudo agregar el paciente"); return; }
      onCreado?.(r);
      cerrar();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo agregar el paciente");
    } finally {
      setGuardando(false);
    }
  }

  const items = data?.items || [];
  const pag = data?.pagination || { page: 1, totalPages: 1, total: 0, limit };

  return (
    <div className="fixed inset-0 z-[var(--z-modal-nested)] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={cerrar} aria-hidden="true" />

      <div role="dialog" aria-modal="true" className={`relative z-[var(--z-content)] w-full rounded-2xl border border-gray-200 bg-white shadow-xl ${persona ? "max-w-lg" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {persona && (
              <button type="button" onClick={() => { setPersona(null); setError(null); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--kt-teal-700)/10 text-(--kt-teal-700)">
              <HeartPulse size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Agregar paciente de kinesiología</h3>
          </div>
          <button type="button" onClick={cerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">

          {/* Paso 1: elegir de la lista de registrados */}
          {!persona && (
            <>
              <p className="text-sm text-slate-500">
                Elegí a cualquier persona ya registrada (sea alumno o no) para agregarla al grupo de kinesiología.
              </p>

              <DataGrid
                rows={items}
                columns={COLUMNAS_PERSONAS}
                keyField="persona_id"
                loading={cargando}
                searchable
                searchPlaceholder="Buscar por nombre, apellido o DNI…"
                onSearch={(val) => { setBusqueda(val); cargar({ resetPage: true, qOverride: val }); }}
                emptyMessage="No hay personas registradas todavía."
                onRowClick={seleccionar}
                page={pag.page}
                totalPages={pag.totalPages}
                totalRows={pag.total}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
                pageSize={limit}
                pageSizeOptions={[10, 20, 30]}
              />

              <p className="text-center text-xs text-slate-400">
                ¿No está en la lista?{" "}
                <Link to="/register" className="font-semibold text-(--kt-teal-700) hover:underline" onClick={cerrar}>
                  Registrarla primero
                </Link>
              </p>
            </>
          )}

          {/* Paso 2: patología + objetivo */}
          {persona && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span className="font-semibold text-slate-800">{persona.apellido} {persona.nombre}</span>
                <span className="text-slate-500">DNI {persona.documento}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Patologías <span className="font-normal text-gray-400">(elegí una o varias)</span>
                </label>
                <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-gray-300 p-1.5">
                  {(catalogos?.patologias || []).map((p) => {
                    const activa = patologiaIds.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => toggleActiva(p.value)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                          activa ? "bg-(--kt-teal-700)/10 text-(--kt-teal-700)" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {p.label}
                        {activa && <Check size={15} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Fecha de diagnóstico"
                  name="fecha_diagnostico"
                  type="date"
                  value={fechaDiagnostico}
                  onChange={(e) => setFechaDiagnostico(e.target.value)}
                />
                <InputField
                  label="Fecha de inicio"
                  name="fecha_inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Objetivo del tratamiento</label>
                <textarea
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  rows={3}
                  placeholder="Ej: Reducir dolor lumbar y recuperar fuerza en tren inferior"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-(--kt-teal-700) focus:ring-2 focus:ring-(--kt-teal-700)/25"
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
          )}
        </div>

        {persona && (
          <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
            <button type="button" onClick={cerrar} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={guardando}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-(--kt-teal-700) px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <UserPlus size={15} />
              {guardando ? "Guardando…" : "Agregar paciente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
