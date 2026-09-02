import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../../../controls/toast/toast_context.jsx";
import {
  getColores, createColor, updateColor, deleteColor,
} from "../catalogo_api.js";
import { useConfirmDelete, CatalogForm, AddButton, TabLoader } from "../catalog_shared.jsx";

function ColorSwatch({ color, onEdit, onDelete, isPending, onConfirm, onCancel }) {
  return (
    <div className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5">
      <div
        className="h-14 w-14 rounded-full border-2 border-white shadow-md ring-1 ring-slate-200"
        style={{ backgroundColor: color.hex ?? "#e5e7eb" }}
      />

      <div className="text-center w-full min-w-0">
        <p className="text-xs font-semibold text-slate-900 truncate">{color.nombre}</p>
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">
          {color.hex ?? "—"}
        </p>
      </div>

      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Pencil size={10} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl">
          <span className="text-[10px] font-bold text-rose-600">¿Eliminar?</span>
          <div className="flex gap-1">
            <button onClick={onConfirm} className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Sí
            </button>
            <button onClick={onCancel} className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ColoresTab() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [nombre,  setNombre]  = useState("");
  const [hex,     setHex]     = useState("#000000");
  const [orden,   setOrden]   = useState("0");
  const toast = useToast();

  const load = useCallback(() => {
    getColores().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = useConfirmDelete(async (id) => {
    try {
      await deleteColor(id);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Color eliminado");
    } catch {
      toast.error("No se pudo eliminar el color");
    }
  });

  function startAdd()  { setAdding(true); setNombre(""); setHex("#000000"); setOrden("0"); setEditId(null); }
  function startEdit(c) { setEditId(c.id); setNombre(c.nombre); setHex(c.hex ?? "#000000"); setOrden(String(c.orden)); setAdding(false); }
  function cancelForm() { setAdding(false); setEditId(null); }

  async function handleSave() {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const updated = await updateColor(editId, nombre.trim(), hex || null, Number(orden));
        setItems((p) => p.map((i) => (i.id === editId ? updated : i)));
        toast.success("Color actualizado");
      } else {
        const created = await createColor(nombre.trim(), hex || null, Number(orden));
        setItems((p) => [...p, created]);
        toast.success("Color creado");
      }
      cancelForm();
    } catch {
      toast.error("Error al guardar el color");
    } finally { setSaving(false); }
  }

  const formFields = (
    <>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="max-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Nombre del color"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5"
          title="Elegir color"
        />
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs uppercase"
          placeholder="#000000"
        />
      </div>
      <input
        type="number"
        value={orden}
        onChange={(e) => setOrden(e.target.value)}
        className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Orden"
        min="0"
      />
    </>
  );

  if (loading) return <TabLoader />;
  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((c) =>
          editId === c.id ? null : (
            <ColorSwatch
              key={c.id}
              color={c}
              onEdit={() => startEdit(c)}
              onDelete={() => del.request(c.id)}
              isPending={del.pendingId === c.id}
              onConfirm={() => del.confirm(c.id)}
              onCancel={del.cancel}
            />
          )
        )}
      </div>

      {editId !== null && (
        <CatalogForm onSave={handleSave} onCancel={cancelForm} saving={saving}>
          {formFields}
        </CatalogForm>
      )}

      {adding ? (
        <CatalogForm onSave={handleSave} onCancel={cancelForm} saving={saving}>
          {formFields}
        </CatalogForm>
      ) : (
        <AddButton onClick={startAdd} label="Agregar color" />
      )}
    </div>
  );
}
