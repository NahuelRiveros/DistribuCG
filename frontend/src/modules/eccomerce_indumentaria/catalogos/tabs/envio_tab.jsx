import { useState, useEffect } from "react";
import { Truck, BadgeCheck } from "lucide-react";
import { useToast } from "../../../../controls/toast/toast_context.jsx";
import {
  getOpcionesEnvio, createOpcionEnvio, updateOpcionEnvio, deleteOpcionEnvio,
} from "../catalogo_api.js";
import { useConfirmDelete, CatalogRow, CatalogForm, AddButton, TabLoader } from "../catalog_shared.jsx";

const fmt = (n) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

export default function EnvioTab() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode,    setMode]    = useState("idle");
  const [saving,  setSaving]  = useState(false);
  const toast = useToast();

  const EMPTY = { nombre: "", descripcion: "", precio: "", tiempo_estimado: "", gratis_desde: "" };
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    getOpcionesEnvio().then(setItems).finally(() => setLoading(false));
  }, []);

  const del = useConfirmDelete(async (id) => {
    try {
      await deleteOpcionEnvio(id);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Opción de envío eliminada");
    } catch {
      toast.error("No se pudo eliminar la opción de envío");
    }
  });

  function startEdit(e) {
    setMode(e.id);
    setForm({
      nombre:          e.nombre,
      descripcion:     e.descripcion,
      precio:          String(e.precio),
      tiempo_estimado: e.tiempo_estimado,
      gratis_desde:    e.gratis_desde != null ? String(e.gratis_desde) : "",
    });
  }

  function startAdd()   { setMode("add"); setForm(EMPTY); }
  function cancelForm() { setMode("idle"); }

  async function handleSave() {
    if (!form.nombre.trim() || !form.precio) return;
    const data = {
      nombre:          form.nombre.trim(),
      descripcion:     form.descripcion.trim(),
      precio:          Number(form.precio),
      tiempo_estimado: form.tiempo_estimado.trim(),
      gratis_desde:    form.gratis_desde ? Number(form.gratis_desde) : null,
    };
    setSaving(true);
    try {
      if (typeof mode === "number") {
        const updated = await updateOpcionEnvio(mode, data);
        setItems((p) => p.map((i) => (i.id === mode ? updated : i)));
        toast.success("Opción de envío actualizada");
      } else {
        const created = await createOpcionEnvio(data);
        setItems((p) => [...p, created]);
        toast.success("Opción de envío creada");
      }
      cancelForm();
    } catch {
      toast.error("Error al guardar la opción de envío");
    } finally { setSaving(false); }
  }

  function f(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  const formFields = (
    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
      <input value={form.nombre}          onChange={f("nombre")}          className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-1" placeholder="Nombre (ej: Envío estándar)" autoFocus />
      <input value={form.descripcion}     onChange={f("descripcion")}     className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-1" placeholder="Descripción (opcional)" />
      <input value={form.tiempo_estimado} onChange={f("tiempo_estimado")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"                          placeholder="Tiempo (ej: 3–5 días hábiles)" />
      <input type="number" value={form.precio}       onChange={f("precio")}       className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Precio $"         min="0" />
      <input type="number" value={form.gratis_desde} onChange={f("gratis_desde")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Gratis desde $ (opcional)" min="0" />
    </div>
  );

  if (loading) return <TabLoader />;
  return (
    <div className="space-y-2">
      {items.map((e) =>
        typeof mode === "number" && mode === e.id ? (
          <CatalogForm key={e.id} onSave={handleSave} onCancel={cancelForm} saving={saving}>
            {formFields}
          </CatalogForm>
        ) : (
          <CatalogRow
            key={e.id}
            onDelete={() => del.request(e.id)}
            onEdit={() => startEdit(e)}
            isConfirmingDelete={del.pendingId === e.id}
            onConfirmDelete={() => del.confirm(e.id)}
            onCancelDelete={del.cancel}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-2">
                <Truck size={14} className="shrink-0 text-slate-400" />
                <span className="font-semibold text-slate-900">{e.nombre}</span>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {fmt(e.precio)}
              </span>
              {e.gratis_desde != null && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <BadgeCheck size={12} />
                  Gratis desde {fmt(e.gratis_desde)}
                </span>
              )}
              {e.tiempo_estimado && (
                <span className="text-xs text-slate-500">{e.tiempo_estimado}</span>
              )}
            </div>
          </CatalogRow>
        )
      )}

      {mode === "add" ? (
        <CatalogForm onSave={handleSave} onCancel={cancelForm} saving={saving}>
          {formFields}
        </CatalogForm>
      ) : (
        <AddButton onClick={startAdd} label="Agregar opción de envío" />
      )}
    </div>
  );
}
