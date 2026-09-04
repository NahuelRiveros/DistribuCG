import { useState } from "react";
import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import { slugify, construirOpcionesCategoria, idsExcluidosComoPadre } from "../utils/categoria_jerarquia.js";

/* ── modal: alta/edición de categoría o subcategoría ────────────────────── */

export default function CategoriaFormModal({ abierto, onClose, onGuardar, categoriaEditar, guardando, categorias, padreInicial }) {
  const [nombre, setNombre] = useState(categoriaEditar?.nombre ?? "");
  const [slug, setSlug] = useState(categoriaEditar?.slug ?? "");
  const [padreId, setPadreId] = useState(categoriaEditar?.padre_id ?? padreInicial ?? "");

  if (!abierto) return null;

  const excluidos = idsExcluidosComoPadre(categoriaEditar, categorias);
  const opcionesPadre = construirOpcionesCategoria(categorias.filter((c) => !excluidos.has(c.id)));

  function submit(e) {
    e.preventDefault();
    onGuardar({
      nombre: nombre.trim(),
      slug: (slug.trim() || slugify(nombre)),
      padre_id: padreId ? Number(padreId) : null,
    });
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {categoriaEditar ? "Editar categoría" : "Nueva categoría"}
          </h2>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <InputField
            label="Nombre" type="text" value={nombre}
            onChange={(e) => { setNombre(e.target.value); if (!categoriaEditar) setSlug(slugify(e.target.value)); }}
            hideMessage placeholder="Ej: Comestibles"
          />
          <InputField
            label="Slug" type="text" value={slug}
            onChange={(e) => setSlug(e.target.value)}
            hideMessage placeholder="Ej: comestibles"
          />
          <SelectField
            label="Categoría padre (opcional)"
            options={opcionesPadre}
            value={padreId}
            onChange={(e) => setPadreId(e.target.value)}
            placeholder="Sin padre — categoría raíz"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={guardando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
