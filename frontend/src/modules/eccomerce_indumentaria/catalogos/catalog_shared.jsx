import { useState, useRef } from "react";
import { Check, X, Pencil, Trash2, Plus } from "lucide-react";

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useConfirmDelete(onConfirm) {
  const [pendingId, setPendingId] = useState(null);
  const timerRef = useRef(null);

  function request(id) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingId(id);
    timerRef.current = setTimeout(() => setPendingId(null), 4000);
  }

  function confirm(id) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingId(null);
    onConfirm(id);
  }

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingId(null);
  }

  return { pendingId, request, confirm, cancel };
}

export function CatalogRow({
  children,
  onDelete,
  onEdit,
  isConfirmingDelete,
  onConfirmDelete,
  onCancelDelete,
  saving,
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50">
      <div className="flex-1 min-w-0">{children}</div>
      {isConfirmingDelete ? (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-rose-500">¿Eliminar?</span>
          <button
            onClick={onConfirmDelete}
            className="flex h-7 items-center gap-1 rounded-lg bg-rose-500 px-2.5 text-[11px] font-bold text-white hover:bg-rose-600 transition-colors"
          >
            <Check size={11} /> Sí
          </button>
          <button
            onClick={onCancelDelete}
            className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-500 hover:border-slate-400 transition-colors"
          >
            <X size={11} /> No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            disabled={saving}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            disabled={saving}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export function CatalogForm({ onSave, onCancel, children, saving }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white shadow-sm px-4 py-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
        >
          <Check size={12} /> {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-500 transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100">
        <Plus size={13} className="text-slate-600" />
      </div>
      {label}
    </button>
  );
}

export function TabLoader() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
    </div>
  );
}
