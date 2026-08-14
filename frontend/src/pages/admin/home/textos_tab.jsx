import { useEffect, useState } from "react";
import { Save, RefreshCw, Eye } from "lucide-react";
import { listarTextosHome, actualizarTextosHome } from "../../../api/home_content_api.js";
import InputField from "../../../components/form/input_field.jsx";

const SECCIONES = [
  { id: "hero",       titulo: "Hero (arriba de todo)" },
  { id: "pilares",    titulo: "Sección \"Nuestro fuerte\"" },
  { id: "galeria",    titulo: "Sección \"Lo que hacemos\"" },
  { id: "contacto",   titulo: "Sección \"Hablemos\"" },
  { id: "footer_cta", titulo: "Franja final (CTA)" },
];

export default function TextosTab() {
  const [textos, setTextos] = useState([]);
  const [valores, setValores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const r = await listarTextosHome();
      const items = r?.data || [];
      setTextos(items);
      setValores(Object.fromEntries(items.map((t) => [t.clave, t.valor || ""])));
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo cargar el contenido de texto");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function cambiar(clave, valor) {
    setValores((v) => ({ ...v, [clave]: valor }));
    setExito("");
  }

  async function guardar() {
    try {
      setGuardando(true);
      setError(""); setExito("");
      const r = await actualizarTextosHome(valores);
      if (!r?.ok) { setError(r?.mensaje || "No se pudo guardar"); return; }
      setExito("Textos guardados — ya se ven en el home.");
      await cargar();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">Cargando…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button" onClick={cargar}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={12} /> Descartar cambios
        </button>
        <button
          type="button" onClick={guardar} disabled={guardando}
          className="inline-flex items-center gap-1.5 rounded-xl bg-(--kt-teal-700) px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          <Save size={12} /> {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {exito && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{exito}</div>}

      {/* ── VISTA PREVIA DEL HERO — se actualiza mientras se tipea ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Eye size={12} /> Vista previa del hero
        </div>
        <div className="bg-linear-to-b from-[var(--kt-bg-soft)] to-white px-6 py-10 text-center">
          <div className="kt-body inline-flex items-center gap-2 rounded-full border border-[var(--kt-border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kt-petrol)] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--kt-turquoise)]" />
            {valores.hero_kicker || "…"}
          </div>
          <h3 className="kt-display mt-4 text-3xl font-bold uppercase leading-none text-[var(--kt-ink)]">KINE<span className="text-(--kt-teal-700)">TICA</span></h3>
          <p className="kt-body mx-auto mt-3 max-w-sm text-xs leading-relaxed text-[var(--kt-ink-soft)]">{valores.hero_subtitulo || "…"}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="rounded-xl bg-(--kt-teal-700) px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white">{valores.hero_cta_primario || "…"}</span>
            <span className="rounded-xl border border-[var(--kt-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--kt-ink)]">{valores.hero_cta_secundario || "…"}</span>
          </div>
        </div>
      </div>

      {SECCIONES.map((seccion) => {
        const items = textos.filter((t) => t.seccion === seccion.id);
        if (!items.length) return null;
        return (
          <div key={seccion.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700">{seccion.titulo}</h2>
            {items.map((t) => (
              <div key={t.clave}>
                {(valores[t.clave]?.length || 0) > 60 ? (
                  <>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.etiqueta}</label>
                    <textarea
                      value={valores[t.clave] ?? ""}
                      onChange={(e) => cambiar(t.clave, e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-(--kt-teal-700) focus:outline-none resize-none"
                    />
                  </>
                ) : (
                  <InputField
                    label={t.etiqueta}
                    type="text"
                    value={valores[t.clave] ?? ""}
                    onChange={(e) => cambiar(t.clave, e.target.value)}
                    hideMessage
                  />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
