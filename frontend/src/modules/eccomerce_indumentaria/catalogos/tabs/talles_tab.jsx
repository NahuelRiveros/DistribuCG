import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../../../controls/toast/toast_context.jsx";
import {
  getTalles, createTalle, updateTalle, deleteTalle,
} from "../catalogo_api.js";
import { useConfirmDelete, CatalogForm, AddButton, TabLoader } from "../catalog_shared.jsx";

function TalleForm({ nombre, setNombre, orden, setOrden, onSave, onCancel, saving }) {
  return (
    <CatalogForm onSave={onSave} onCancel={onCancel} saving={saving}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Talle / medida</span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Ej: XL"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nivel</span>
        <input
          type="number"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="0"
          min="0"
          title="Número que controla el orden de visualización — menor = primero"
        />
      </div>
    </CatalogForm>
  );
}

export default function TallesTab() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [nombre,  setNombre]  = useState("");
  const [orden,   setOrden]   = useState("0");
  const toast = useToast();

  const load = useCallback(() => {
    getTalles().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = useConfirmDelete(async (id) => {
    try {
      await deleteTalle(id);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Talle eliminado");
    } catch {
      toast.error("No se pudo eliminar el talle");
    }
  });

  function startAdd()   { setAdding(true); setNombre(""); setOrden(String(items.length * 10)); setEditId(null); }
  function startEdit(t) { setEditId(t.id); setNombre(t.nombre); setOrden(String(t.orden)); setAdding(false); }
  function cancelForm() { setAdding(false); setEditId(null); }

  async function handleSave() {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const updated = await updateTalle(editId, nombre.trim(), Number(orden));
        setItems((p) => p.map((i) => (i.id === editId ? updated : i)));
        toast.success("Talle actualizado");
      } else {
        const created = await createTalle(nombre.trim(), Number(orden));
        setItems((p) => [...p, created].sort((a, b) => a.orden - b.orden));
        toast.success("Talle creado");
      }
      cancelForm();
    } catch {
      toast.error("Error al guardar el talle");
    } finally { setSaving(false); }
  }

  if (loading) return <TabLoader />;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {items.map((t) =>
          editId === t.id ? null : (
            <div
              key={t.id}
              className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-all hover:border-slate-400 hover:shadow-sm"
            >
              <span className="text-sm font-black text-slate-900">{t.nombre}</span>
              <span className="text-[9px] font-medium text-slate-500" title="Nivel de orden">
                #{t.orden}
              </span>

              {del.pendingId === t.id ? (
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => del.confirm(t.id)}
                    className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                  >
                    ✓
                  </button>
                  <button
                    onClick={del.cancel}
                    className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(t)}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => del.request(t.id)}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {editId !== null && (
        <TalleForm
          nombre={nombre} setNombre={setNombre}
          orden={orden}   setOrden={setOrden}
          onSave={handleSave} onCancel={cancelForm} saving={saving}
        />
      )}

      {adding ? (
        <TalleForm
          nombre={nombre} setNombre={setNombre}
          orden={orden}   setOrden={setOrden}
          onSave={handleSave} onCancel={cancelForm} saving={saving}
        />
      ) : (
        <AddButton onClick={startAdd} label="Agregar talle / medida" />
      )}
    </div>
  );
}
