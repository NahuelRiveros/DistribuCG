import { useState } from "react";
import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import ImageUploadField from "../../../controls/ui/image_upload_field.jsx";

/**
 * Modal de alta/edición del producto — incluye precio/IVA/stock/oferta de
 * su (única) variedad en el mismo formulario, tanto al crear como al editar.
 * Antes existía una acción aparte ("Variedades") para cargar esos datos
 * después de crear el producto, y no se podían tocar desde acá al editar —
 * dos pasos de más para el caso normal de una sola presentación. Si en el
 * futuro un producto necesita más de una presentación, crearVariedad/
 * actualizarVariedad en el backend lo siguen soportando a nivel de datos,
 * pero no hay UI para eso hoy.
 */
export default function ProductoFormModal({ abierto, onClose, onGuardar, productoEditar, guardando, opcionesCategoria, categoriaInicial }) {
  const variedad = productoEditar?.variedades?.[0];
  const [categoriaId, setCategoriaId] = useState(productoEditar?.categoria_id ?? categoriaInicial ?? "");
  const [nombre, setNombre] = useState(productoEditar?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(productoEditar?.descripcion ?? "");
  const [marca, setMarca] = useState(productoEditar?.marca ?? "");
  const [imagenUrl, setImagenUrl] = useState(productoEditar?.imagen_url ?? "");
  const [precio, setPrecio] = useState(variedad?.precio ?? "");
  const [precioAnterior, setPrecioAnterior] = useState(variedad?.precio_anterior ?? "");
  const [ivaPorcentaje, setIvaPorcentaje] = useState(variedad?.iva_porcentaje ?? "21");
  const [controlaStock, setControlaStock] = useState(variedad?.controla_stock ?? false);
  const [stock, setStock] = useState(variedad?.cantidad ?? "0");

  if (!abierto) return null;

  function submit(e) {
    e.preventDefault();
    onGuardar({
      categoria_id: Number(categoriaId),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      marca: marca.trim() || null,
      imagen_url: imagenUrl.trim() || null,
      precio: Number(precio),
      precio_anterior: precioAnterior ? Number(precioAnterior) : null,
      iva_porcentaje: Number(ivaPorcentaje) || 21,
      controla_stock: controlaStock,
      cantidad: controlaStock ? Number(stock) || 0 : 0,
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
        <form onSubmit={submit} className="max-h-[80vh] space-y-4 overflow-y-auto px-6 py-5">
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

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Precio de venta y stock.</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Precio" type="number" step="0.01" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} hideMessage placeholder="Ej: 1500" />
              <InputField label="IVA (%)" type="number" step="0.1" min="0" max="100" value={ivaPorcentaje} onChange={(e) => setIvaPorcentaje(e.target.value)} hideMessage />
            </div>
            <InputField
              label="Precio anterior — oferta (opcional)" type="number" step="0.01" min="0"
              value={precioAnterior} onChange={(e) => setPrecioAnterior(e.target.value)}
              placeholder="Ej: 2000" helperText="Solo se muestra como oferta en el catálogo si es mayor al precio de venta."
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={controlaStock} onChange={(e) => setControlaStock(e.target.checked)} />
              Controlar stock
            </label>
            {controlaStock && (
              <InputField
                label="Stock" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} hideMessage
                helperText="0 = sin stock — el producto se muestra como agotado en el catálogo."
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={guardando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={guardando || !categoriaId || !precio}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
