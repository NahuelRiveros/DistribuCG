import { useState, useEffect, useCallback, useRef } from "react";
import { Pencil, Trash2, ImagePlus, X, Check, Link } from "lucide-react";
import { useToast } from "../../../../controls/toast/toast_context.jsx";
import {
  getMarcas, createMarca, updateMarca, deleteMarca,
} from "../catalogo_api.js";
import { subirImagen, eliminarImagen } from "../../../../api/upload_api.js";
import { slugify, useConfirmDelete, AddButton, TabLoader } from "../catalog_shared.jsx";

// ── Logo: drag & drop + URL manual ──────────────────────────────
function LogoInput({ value, onChange }) {
  const fileRef      = useRef(null);
  const pendingPubId = useRef(null); // public_id del último upload en esta sesión
  const [isDragging, setIsDragging] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [urlMode,    setUrlMode]    = useState(!value);
  const [error,      setError]      = useState("");

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Solo se aceptan imágenes."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("El archivo no puede superar 5 MB."); return; }
    setError("");
    setUploading(true);
    try {
      if (pendingPubId.current) {
        eliminarImagen(pendingPubId.current).catch(() => {});
        pendingPubId.current = null;
      }
      const { url, public_id } = await subirImagen(file);
      pendingPubId.current = public_id;
      onChange(url);
      setUrlMode(false);
    } catch {
      setError("No se pudo subir la imagen. Intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleFileInput(e) {
    handleFile(e.target.files[0]);
    e.target.value = "";
  }

  function clearLogo() {
    onChange("");
    pendingPubId.current = null;
    setUrlMode(true);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-start gap-3">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !uploading && fileRef.current?.click()}
          title="Arrastrá una imagen o hacé clic para seleccionar"
          className={[
            "relative flex h-18 w-18 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed transition-all select-none",
            isDragging
              ? "border-slate-900 bg-slate-100 scale-[1.03]"
              : uploading
              ? "border-slate-200 bg-white opacity-70 cursor-not-allowed"
              : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50",
          ].join(" ")}
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          ) : value ? (
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-contain p-2"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <>
              <ImagePlus size={18} className={isDragging ? "text-slate-900" : "text-slate-400"} />
              <span className={`text-[9px] font-semibold text-center leading-tight px-1 ${isDragging ? "text-slate-900" : "text-slate-400"}`}>
                {isDragging ? "Soltar aquí" : "Subir imagen"}
              </span>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {(urlMode || !value) && (
            <div className="flex items-center gap-1.5">
              <Link size={11} className="shrink-0 text-slate-400" />
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                placeholder="O pegá una URL de imagen…"
              />
            </div>
          )}

          {value && !urlMode && (
            <button
              type="button"
              onClick={() => setUrlMode(true)}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Link size={9} /> Usar URL en su lugar
            </button>
          )}

          {value && (
            <button
              type="button"
              onClick={clearLogo}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-500 transition-colors"
            >
              <X size={9} /> Quitar logo
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  );
}

function MarcaForm({ nombre, setNombre, slug, setSlug, logo, setLogo, onSave, onCancel, saving }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setSlug(slugify(e.target.value)); }}
          className="min-w-0 max-w-xs flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nombre de la marca"
          autoFocus
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-36 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          placeholder="slug"
        />
      </div>

      <LogoInput value={logo} onChange={setLogo} />

      <div className="flex gap-1.5 pt-1 border-t border-slate-100">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
        >
          <Check size={12} />
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function BrandCard({ marca, onEdit, onDelete, isPending, onConfirm, onCancel }) {
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex h-20 items-center justify-center bg-slate-50 border-b border-slate-200 px-4">
        {marca.logo ? (
          <img
            src={marca.logo}
            alt={marca.nombre}
            className="max-h-14 max-w-full object-contain"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
            <span className="text-xl font-black text-white leading-none">
              {marca.nombre[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="text-sm font-bold text-slate-900 truncate">{marca.nombre}</p>
        <p className="font-mono text-[10px] text-slate-500 truncate">{marca.slug}</p>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl">
          <span className="text-[11px] font-bold text-rose-600">¿Eliminar?</span>
          <div className="flex gap-1.5">
            <button onClick={onConfirm} className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white">Sí</button>
            <button onClick={onCancel}  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500">No</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarcasTab() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [nombre,  setNombre]  = useState("");
  const [slug,    setSlug]    = useState("");
  const [logo,    setLogo]    = useState("");
  const toast = useToast();

  const load = useCallback(() => {
    getMarcas().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = useConfirmDelete(async (id) => {
    try {
      await deleteMarca(id);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Marca eliminada");
    } catch {
      toast.error("No se pudo eliminar la marca");
    }
  });

  function resetForm() { setNombre(""); setSlug(""); setLogo(""); }
  function startAdd()  { setAdding(true); resetForm(); setEditId(null); }
  function startEdit(m) {
    setEditId(m.id); setNombre(m.nombre); setSlug(m.slug);
    setLogo(m.logo ?? ""); setAdding(false);
  }
  function cancelForm() { setAdding(false); setEditId(null); }

  async function handleSave() {
    if (!nombre.trim()) return;
    const s = slug || slugify(nombre);
    setSaving(true);
    try {
      const orden = editId
        ? (items.find((i) => i.id === editId)?.orden ?? 0)
        : items.length * 10;
      const data = { nombre: nombre.trim(), slug: s, logo: logo || null, descripcion: null, orden };
      if (editId) {
        const updated = await updateMarca(editId, data);
        setItems((p) => p.map((i) => (i.id === editId ? updated : i)));
        toast.success("Marca actualizada");
      } else {
        const created = await createMarca(data);
        setItems((p) => [...p, created].sort((a, b) => a.orden - b.orden));
        toast.success("Marca creada");
      }
      cancelForm();
    } catch (err) {
      const msg    = err?.response?.data?.mensaje ?? err?.message ?? "Error desconocido";
      const status = err?.response?.status;
      if (status === 403) toast.error("Sin permisos. Cerrá sesión y volvé a entrar.");
      else if (status === 409 || msg.toLowerCase().includes("exist"))
        toast.error("Ya existe una marca con ese nombre o slug.");
      else toast.error(`Error al guardar: ${msg}`);
    } finally { setSaving(false); }
  }

  if (loading) return <TabLoader />;
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) =>
          editId === m.id ? null : (
            <BrandCard
              key={m.id}
              marca={m}
              onEdit={() => startEdit(m)}
              onDelete={() => del.request(m.id)}
              isPending={del.pendingId === m.id}
              onConfirm={() => del.confirm(m.id)}
              onCancel={del.cancel}
            />
          )
        )}
      </div>

      {editId !== null && (
        <MarcaForm
          nombre={nombre} setNombre={setNombre}
          slug={slug}     setSlug={setSlug}
          logo={logo}     setLogo={setLogo}
          onSave={handleSave} onCancel={cancelForm} saving={saving}
        />
      )}

      {adding ? (
        <MarcaForm
          nombre={nombre} setNombre={setNombre}
          slug={slug}     setSlug={setSlug}
          logo={logo}     setLogo={setLogo}
          onSave={handleSave} onCancel={cancelForm} saving={saving}
        />
      ) : (
        <AddButton onClick={startAdd} label="Agregar marca" />
      )}
    </div>
  );
}
