import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Trash2, ShieldCheck, ShieldOff, AlertTriangle, CheckCircle } from "lucide-react";
import {
  getBannerAdmin, crearBannerAnuncio, actualizarBannerAnuncio, cambiarEstadoBannerAnuncio, eliminarBannerAnuncio,
} from "../../../api/banner_anuncio_api.js";

const MAX_ANUNCIOS = 4;

function FilaAnuncio({ anuncio, onGuardar, onEstado, onEliminar }) {
  const [texto, setTexto] = useState(anuncio.texto);
  const [guardando, setGuardando] = useState(false);
  const sucio = texto !== anuncio.texto;

  async function guardar() {
    setGuardando(true);
    try { await onGuardar(anuncio.id, texto); } finally { setGuardando(false); }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200}
        placeholder="Ej: Envío gratis en compras desde $50.000"
        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
      />
      {sucio && (
        <button type="button" onClick={guardar} disabled={guardando || !texto.trim()}
          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      )}
      <button
        type="button" onClick={() => onEstado(anuncio.id, !anuncio.activo)}
        className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold ${anuncio.activo ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
      >
        {anuncio.activo ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
        {anuncio.activo ? "Activo" : "Inactivo"}
      </button>
      <button type="button" onClick={() => onEliminar(anuncio.id)} className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function GestionAnunciosPage() {
  // Invalida el caché de la cinta pública (staleTime 5min en AnunciosBanner,
  // que se monta una sola vez en app_layout.jsx y no se remonta al navegar)
  // — sin esto, un cambio acá no se ve reflejado en el sitio hasta que la
  // otra pestaña/sesión haga un refresh completo.
  const queryClient = useQueryClient();
  const invalidarCintaPublica = () => queryClient.invalidateQueries({ queryKey: ["banner-anuncios"] });
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [agregando, setAgregando] = useState(false);

  async function cargar() {
    try {
      setCargando(true); setError("");
      const r = await getBannerAdmin();
      if (!r?.ok) { setError(r?.mensaje || "No se pudo cargar el listado"); return; }
      setItems(r.data || []);
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo cargar el listado");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function agregar() {
    setAgregando(true); setError(""); setExito("");
    try {
      const r = await crearBannerAnuncio({ texto: "Nuevo anuncio", orden: items.length });
      if (!r.ok) { setError(r.mensaje); return; }
      await cargar();
      invalidarCintaPublica();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo crear el anuncio");
    } finally {
      setAgregando(false);
    }
  }

  async function guardarTexto(id, texto) {
    setError(""); setExito("");
    try {
      const r = await actualizarBannerAnuncio(id, { texto });
      if (!r.ok) { setError(r.mensaje); return; }
      setExito("Anuncio actualizado.");
      await cargar();
      invalidarCintaPublica();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo guardar el anuncio");
    }
  }

  async function cambiarEstado(id, activo) {
    setError(""); setExito("");
    try {
      const r = await cambiarEstadoBannerAnuncio(id, activo);
      if (!r.ok) { setError(r.mensaje); return; }
      await cargar();
      invalidarCintaPublica();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo cambiar el estado");
    }
  }

  async function eliminar(id) {
    if (!window.confirm("¿Eliminar este anuncio de la cinta?")) return;
    setError(""); setExito("");
    try {
      const r = await eliminarBannerAnuncio(id);
      if (!r.ok) { setError(r.mensaje); return; }
      await cargar();
      invalidarCintaPublica();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo eliminar el anuncio");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-4">

        <div className="overflow-hidden rounded-2xl border border-(--kt-turquoise-border) bg-white shadow-sm shadow-(--kt-turquoise)/10">
          <div className="h-1 w-full bg-linear-to-r from-(--kt-teal-700) via-(--kt-petrol) to-(--kt-turquoise)" />
          <div className="px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--kt-teal-700) px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              <Megaphone size={11} /> Admin
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Cinta de anuncios</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Los anuncios activos rotan arriba de todo, en toda la app. Hasta {MAX_ANUNCIOS} — ej. "Envío gratis desde $50.000".
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={15} className="shrink-0" /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" /> {exito}
          </div>
        )}

        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">Cargando…</div>
        ) : (
          <div className="space-y-2.5">
            {items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-400">
                Sin anuncios todavía — la cinta no se muestra hasta que agregues al menos uno.
              </p>
            )}
            {items.map((anuncio) => (
              <FilaAnuncio key={anuncio.id} anuncio={anuncio} onGuardar={guardarTexto} onEstado={cambiarEstado} onEliminar={eliminar} />
            ))}
            {items.length < MAX_ANUNCIOS ? (
              <button
                type="button" onClick={agregar} disabled={agregando}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
              >
                <Plus size={15} /> {agregando ? "Agregando…" : "Agregar anuncio"}
              </button>
            ) : (
              <p className="text-center text-xs text-slate-400">Llegaste al tope de {MAX_ANUNCIOS} anuncios — eliminá uno para agregar otro.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
