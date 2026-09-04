import { useState } from "react";
import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import ImageUploadField from "../../../controls/ui/image_upload_field.jsx";

/* ── modal: alta/edición del producto (sin variedades) ─────────────────── */

export default function ProductoFormModal({ abierto, onClose, onGuardar, productoEditar, guardando, opcionesCategoria, categoriaInicial }) {
  const [categoriaId, setCategoriaId] = useState(productoEditar?.categoria_id ?? categoriaInicial ?? "");
  const [nombre, setNombre] = useState(productoEditar?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(productoEditar?.descripcion ?? "");
  const [marca, setMarca] = useState(productoEditar?.marca ?? "");
  const [imagenUrl, setImagenUrl] = useState(productoEditar?.imagen_url ?? "");

  if (!abierto) return null;

  function submit(e) {
    e.preventDefault();
    onGuardar({
      categoria_id: Number(categoriaId),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      marca: marca.trim() || null,
      imagen_url: imagenUrl.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {productoEditar ? "Editar producto" : "Nuevo producto"}
          </h2>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <SelectField
            label="Categoría"
            options={opcionesCategoria}
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            helperText="› indica subcategoría — elegí la más específica posible."
          />
          <InputField label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} hideMessage placeholder="Ej: Galletitas Oreo" />
          <InputField label="Marca (opcional)" type="text" value={marca} onChange={(e) => setMarca(e.target.value)} hideMessage placeholder="Ej: Terrabusi" />
          <InputField label="Descripción (opcional)" type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} hideMessage />
          <ImageUploadField
            label="Imagen (opcional)"
            tooltip="Arrastrá una foto del producto acá, o pegá una URL si ya la tenés alojada en otro lado."
            value={imagenUrl}
            onChange={setImagenUrl}
          />

          {!productoEditar && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Después de crear el producto, agregale al menos una variedad (con precio) para que sea comprable.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={guardando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={guardando || !categoriaId}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
