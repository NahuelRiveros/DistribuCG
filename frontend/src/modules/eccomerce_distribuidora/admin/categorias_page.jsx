import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import DataGrid from "../../../controls/ui/data_grid.jsx";
import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { useCrudPage } from "../../../hooks/use_crud_page.js";
import { getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from "../api/categoria_distribuidora_api.js";

function slugify(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CategoriaFormModal({ abierto, onClose, onGuardar, categoriaEditar, guardando, categorias }) {
  const [nombre, setNombre] = useState(categoriaEditar?.nombre ?? "");
  const [slug, setSlug] = useState(categoriaEditar?.slug ?? "");
  const [padreId, setPadreId] = useState(categoriaEditar?.padre_id ?? "");

  if (!abierto) return null;

  const opcionesPadre = categorias
    .filter((c) => c.id !== categoriaEditar?.id) // no puede ser su propia padre
    .map((c) => ({ value: c.id, label: c.nombre }));

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

export default function CategoriasDistribuidoraPage() {
  const {
    items, cargando, error,
    modalAbierto, seleccionado, guardando,
    abrirNuevo, abrirEditar, cerrarModal, guardar, ejecutarAccion,
  } = useCrudPage({
    fetchFn: getCategorias,
    createFn: crearCategoria,
    updateFn: actualizarCategoria,
    extractItems: (r) => r ?? [], // getCategorias ya devuelve el array pelado
    mensajeErrorCarga: "No se pudo cargar el listado de categorías",
  });

  function eliminar(row) {
    ejecutarAccion(() => eliminarCategoria(row.id), {
      confirmMessage: `¿Seguro que querés eliminar "${row.nombre}"?`,
      mensajeError: "No se pudo eliminar la categoría",
    });
  }

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true, searchable: true, className: "font-semibold text-slate-800" },
    { key: "slug", label: "Slug", className: "text-slate-500 font-mono text-xs" },
    {
      key: "padre_id", label: "Categoría padre",
      render: (row) => items.find((c) => c.id === row.padre_id)?.nombre ?? "—",
    },
  ];

  const actions = [
    { key: "editar", label: "Editar", icon: <Edit2 size={12} />, variant: "primary", onClick: abrirEditar },
    { key: "eliminar", label: "Eliminar", icon: <Trash2 size={12} />, variant: "danger", onClick: eliminar },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Categorías</h1>
            <p className="mt-0.5 text-sm text-slate-500">Organizá el catálogo en categorías y subcategorías.</p>
          </div>
          <button
            type="button" onClick={abrirNuevo}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition self-start sm:self-auto"
          >
            <Plus size={14} /> Nueva categoría
          </button>
        </div>

        <ErrorBanner message={error} />

        <DataGrid
          rows={items}
          columns={columns}
          keyField="id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar categoría…"
          emptyMessage="No hay categorías cargadas."
          actions={actions}
          pageSize={20}
          pageSizeOptions={[10, 20, 50]}
        />

      </div>

      <CategoriaFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardar={guardar}
        categoriaEditar={seleccionado}
        guardando={guardando}
        categorias={items}
      />
    </div>
  );
}
