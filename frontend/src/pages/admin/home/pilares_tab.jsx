import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit2, ShieldCheck, ShieldOff, Trash2, GripVertical } from "lucide-react";
import {
  listarPilaresHome, crearPilarHome, actualizarPilarHome,
  cambiarEstadoPilarHome, eliminarPilarHome,
} from "../../../api/home_content_api.js";
import { iconoHome } from "../../../config/home_iconos.js";
import IconoPicker from "../../../components/form/icono_picker.jsx";

function PilarFormModal({ abierto, onClose, onGuardar, pilar, guardando }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { icono: "Dumbbell", titulo: "", texto: "" },
  });

  useEffect(() => {
    if (!abierto) return;
    reset({ icono: pilar?.icono || "Dumbbell", titulo: pilar?.titulo || "", texto: pilar?.texto || "" });
  }, [abierto, pilar, reset]);

  if (!abierto) return null;

  function submit(data) {
    onGuardar({ icono: data.icono, titulo: data.titulo.trim(), texto: data.texto.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{pilar ? "Editar pilar" : "Nuevo pilar"}</h2>
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ícono</label>
            <IconoPicker value={watch("icono")} onChange={(v) => setValue("icono", v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Título</label>
            <input {...register("titulo", { required: true })} placeholder="Ej: Entrenamiento personalizado"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-(--kt-teal-700) focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Texto</label>
            <textarea {...register("texto", { required: true })} rows={3} placeholder="Descripción corta"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-(--kt-teal-700) focus:outline-none resize-none" />
          </div>
          {(errors.titulo || errors.texto) && <p className="text-sm text-red-600">Completá título y texto</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={guardando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-xl bg-(--kt-teal-700) px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {guardando ? "Guardando..." : pilar ? "Guardar cambios" : "Crear pilar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PilaresTab() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const r = await listarPilaresHome();
      setItems(r?.data || []);
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo cargar los pilares");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() { setSeleccionado(null); setModalAbierto(true); }
  function abrirEditar(item) { setSeleccionado(item); setModalAbierto(true); }

  async function guardar(data) {
    try {
      setGuardando(true);
      const r = seleccionado ? await actualizarPilarHome(seleccionado.id, data) : await crearPilarHome(data);
      if (!r?.ok) { setError(r?.mensaje || "No se pudo guardar"); return; }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(item) {
    try {
      await cambiarEstadoPilarHome(item.id, !item.activo);
      await cargar();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo cambiar el estado");
    }
  }

  async function eliminar(item) {
    if (!window.confirm(`¿Borrar el pilar "${item.titulo}"?`)) return;
    try {
      await eliminarPilarHome(item.id);
      await cargar();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo eliminar");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Las tarjetas debajo del hero, en "Nuestro fuerte". Los inactivos no se muestran en el home.</p>
        <button type="button" onClick={abrirNuevo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-(--kt-teal-700) px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
          <Plus size={14} /> Nuevo pilar
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {cargando ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-400">Todavía no hay pilares cargados.</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const Icon = iconoHome(item.icono);
            return (
              <div key={item.id} className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
                <GripVertical size={14} className="shrink-0 text-slate-300" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-(--kt-teal-700) to-[#0B7D8F] text-white">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.titulo}</p>
                  <p className="truncate text-xs text-slate-500">{item.texto}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.activo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  {item.activo ? "Activo" : "Inactivo"}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => abrirEditar(item)} title="Editar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-(--kt-teal-700)"><Edit2 size={14} /></button>
                  <button type="button" onClick={() => toggleEstado(item)} title={item.activo ? "Desactivar" : "Activar"} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600">
                    {item.activo ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                  </button>
                  <button type="button" onClick={() => eliminar(item)} title="Borrar" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PilarFormModal
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardar={guardar}
        pilar={seleccionado}
        guardando={guardando}
      />
    </div>
  );
}
