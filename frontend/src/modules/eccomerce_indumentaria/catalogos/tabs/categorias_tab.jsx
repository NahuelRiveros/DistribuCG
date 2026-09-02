import { useState, useEffect, useCallback } from "react";
import { Tag, ChevronDown } from "lucide-react";
import { useToast } from "../../../../controls/toast/toast_context.jsx";
import {
  getCategorias, createCategoria, updateCategoria, deleteCategoria,
} from "../catalogo_api.js";
import { slugify, useConfirmDelete, CatalogRow, AddButton, TabLoader } from "../catalog_shared.jsx";

// Subcategorías con el mismo nombre bajo distintos padres generan slugs
// duplicados. Prefijando con el slug del padre queda globalmente único:
//   "Chicas" bajo "Remeras" → remeras-chicas
//   "Chicas" bajo "Chombas" → chombas-chicas
function buildSlug(nombre, padreId, items) {
  const base = slugify(nombre);
  if (!padreId && padreId !== 0) return base;
  const padre = items.find((c) => c.id === Number(padreId));
  return padre ? `${padre.slug}-${base}` : base;
}

export default function CategoriasTab() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [formOpen,  setFormOpen]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [collapsed, setCollapsed] = useState(new Set());
  const toast = useToast();

  const [nombre,  setNombre]  = useState("");
  const [slug,    setSlug]    = useState("");
  const [padreId, setPadreId] = useState("");

  const load = useCallback(async () => {
    const cats = await getCategorias();
    setItems(cats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = useConfirmDelete(async (id) => {
    try {
      await deleteCategoria(id);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Categoría eliminada");
    } catch (err) {
      toast.error(err?.response?.data?.mensaje ?? "No se pudo eliminar");
    }
  });

  function resetForm() { setNombre(""); setSlug(""); setPadreId(""); }
  function startAdd()  { resetForm(); setFormOpen("add"); }
  function startEdit(c) {
    setNombre(c.nombre); setSlug(c.slug); setPadreId(c.padre_id ?? "");
    setFormOpen(c.id);
  }
  function cancelForm() { setFormOpen(null); }

  function toggleCollapse(id) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!nombre.trim()) return;
    const padre = padreId === "" ? null : Number(padreId);
    const s = slug.trim() || buildSlug(nombre, padreId, items);
    setSaving(true);
    try {
      if (typeof formOpen === "number") {
        const updated = await updateCategoria(formOpen, nombre.trim(), s, padre);
        setItems((p) => p.map((i) => (i.id === formOpen ? updated : i)));
        toast.success("Categoría actualizada");
      } else {
        const created = await createCategoria(nombre.trim(), s, padre);
        setItems((p) => [...p, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        toast.success("Categoría creada");
      }
      cancelForm();
    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.mensaje ?? "";
      if (status === 409 || msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("slug")) {
        toast.error(`El slug "${s}" ya existe. Cambiá el nombre o editá el slug manualmente.`);
      } else {
        toast.error(msg || "Error al guardar la categoría");
      }
    } finally { setSaving(false); }
  }

  const raices    = items.filter((c) => c.padre_id === null).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const subs      = (parentId) => items.filter((c) => c.padre_id === parentId).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const huerfanas = items.filter((c) => c.padre_id !== null && !items.some((r) => r.id === c.padre_id));

  function CatForm() {
    return (
      <div className="space-y-3 rounded-xl border border-slate-300 bg-white shadow-sm px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setSlug(buildSlug(e.target.value, padreId, items));
            }}
            className="min-w-0 max-w-xs flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nombre (ej: Pantalones)"
            autoFocus
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            placeholder="slug (auto)"
            title="Se genera automáticamente. Podés editarlo si necesitás."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="w-28 shrink-0 text-xs font-semibold text-slate-500">Subcategoría de</label>
          <select
            value={padreId}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              setPadreId(val);
              if (nombre.trim()) setSlug(buildSlug(nombre, val, items));
            }}
            className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— categoría raíz —</option>
            {raices
              .filter((r) => r.id !== (typeof formOpen === "number" ? formOpen : -1))
              .map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)
            }
          </select>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={cancelForm}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-400 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <TabLoader />;
  return (
    <div className="space-y-1">
      {raices.map((root) => {
        const subItems = subs(root.id);
        const hasSubs  = subItems.length > 0;
        const isOpen   = !collapsed.has(root.id);

        return (
          <div key={root.id}>
            {formOpen === root.id ? <CatForm /> : (
              <CatalogRow
                onDelete={() => del.request(root.id)}
                onEdit={() => startEdit(root)}
                isConfirmingDelete={del.pendingId === root.id}
                onConfirmDelete={() => del.confirm(root.id)}
                onCancelDelete={del.cancel}
              >
                <div className="flex items-center gap-2">
                  {hasSubs ? (
                    <button
                      onClick={() => toggleCollapse(root.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <ChevronDown
                        size={13}
                        className={["transition-transform duration-200", isOpen ? "" : "-rotate-90"].join(" ")}
                      />
                    </button>
                  ) : (
                    <div className="w-6 shrink-0" />
                  )}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Tag size={13} className="text-slate-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900">{root.nombre}</p>
                      {hasSubs && !isOpen && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                          {subItems.length} {subItems.length === 1 ? "tipo" : "tipos"}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-slate-500">{root.slug}</p>
                  </div>
                </div>
              </CatalogRow>
            )}

            {isOpen && hasSubs && (
              <div className="ml-14 pl-3 border-l border-slate-200 space-y-0.5 my-0.5">
                {subItems.map((sub) =>
                  formOpen === sub.id ? (
                    <div key={sub.id}><CatForm /></div>
                  ) : (
                    <CatalogRow
                      key={sub.id}
                      onDelete={() => del.request(sub.id)}
                      onEdit={() => startEdit(sub)}
                      isConfirmingDelete={del.pendingId === sub.id}
                      onConfirmDelete={() => del.confirm(sub.id)}
                      onCancelDelete={del.cancel}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50">
                          <Tag size={11} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{sub.nombre}</p>
                          <p className="font-mono text-[10px] text-slate-500">{sub.slug}</p>
                        </div>
                      </div>
                    </CatalogRow>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}

      {huerfanas.map((c) =>
        formOpen === c.id ? <CatForm key={c.id} /> : (
          <CatalogRow
            key={c.id}
            onDelete={() => del.request(c.id)}
            onEdit={() => startEdit(c)}
            isConfirmingDelete={del.pendingId === c.id}
            onConfirmDelete={() => del.confirm(c.id)}
            onCancelDelete={del.cancel}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Tag size={13} className="text-slate-700" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{c.nombre}</p>
            </div>
          </CatalogRow>
        )
      )}

      {formOpen === "add" ? <CatForm /> : <AddButton onClick={startAdd} label="Agregar categoría" />}
    </div>
  );
}
