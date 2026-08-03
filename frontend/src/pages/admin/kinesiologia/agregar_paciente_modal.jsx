import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, UserPlus, HeartPulse, CheckCircle2 } from "lucide-react";
import InputField from "../../../components/form/input_field.jsx";
import SelectField from "../../../components/form/select_field.jsx";
import { buscarPersonaKinesiologia, agregarPacienteKinesiologia } from "../../../api/kinesiologia_api.js";
import { useCatalogos } from "../../../hooks/use_catalogos.js";

export default function AgregarPacienteModal({ open, onClose, onCreado }) {
  const { data: catalogos } = useCatalogos();

  const [dni, setDni] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const [persona, setPersona] = useState(null);
  const [noEncontrada, setNoEncontrada] = useState(false);

  const [patologiaId, setPatologiaId] = useState("");
  const [fechaDiagnostico, setFechaDiagnostico] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!open) return null;

  function resetear() {
    setDni(""); setPersona(null); setNoEncontrada(false); setError(null);
    setPatologiaId(""); setFechaDiagnostico(""); setFechaInicio(""); setObjetivo("");
  }

  function cerrar() {
    resetear();
    onClose();
  }

  async function buscar() {
    if (!dni.trim()) return;
    setBuscando(true);
    setError(null);
    setPersona(null);
    setNoEncontrada(false);
    try {
      const r = await buscarPersonaKinesiologia(dni.trim());
      if (!r.ok) { setNoEncontrada(true); return; }
      if (r.ya_es_paciente_kinesiologia) {
        setError("Esta persona ya es paciente de kinesiología. Podés cargarle una nueva patología desde su ficha.");
        return;
      }
      setPersona(r.persona);
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo buscar la persona");
    } finally {
      setBuscando(false);
    }
  }

  async function confirmar() {
    if (!patologiaId || !objetivo.trim()) {
      setError("Elegí una patología y cargá el objetivo del tratamiento");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const r = await agregarPacienteKinesiologia({
        persona_id: persona.persona_id,
        patologia_id: Number(patologiaId),
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={cerrar} aria-hidden="true" />

      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
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

          {/* Paso 1: buscar persona */}
          {!persona && (
            <>
              <p className="text-sm text-slate-500">
                Buscá por DNI a una persona ya registrada (sea alumno o no) para agregarla al grupo de kinesiología.
              </p>
              <div className="flex gap-2">
                <InputField
                  name="dni"
                  placeholder="DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscar()}
                  inputMode="numeric"
                  hideLabel
                  wrapperClassName="flex-1"
                />
                <button
                  type="button"
                  onClick={buscar}
                  disabled={buscando}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-(--kt-teal-700) px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  <Search size={15} />
                  {buscando ? "Buscando…" : "Buscar"}
                </button>
              </div>

              {noEncontrada && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
                  No hay ninguna persona registrada con ese DNI.{" "}
                  <Link to="/register" className="font-semibold text-(--kt-teal-700) hover:underline" onClick={cerrar}>
                    Registrarla primero
                  </Link>
                </div>
              )}
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

              <SelectField
                label="Patología"
                name="patologia_id"
                value={patologiaId}
                onChange={(e) => setPatologiaId(e.target.value)}
                options={catalogos?.patologias || []}
                placeholder="Elegir patología…"
              />

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
