import { useEffect, useState } from "react";
import InputField from "../ui/input_field.jsx";

const estadoInicial = {
  nombre: "",
  categoria_id: "",
  precio_venta: 0,
  stock_minimo: 0,
};

export default function ProductoFormModal({
  abierto,
  onClose,
  onGuardar,
  productoEditar = null,
  categorias = [],
  cargando = false,
}) {
  const [form, setForm] = useState(estadoInicial);
  const [errores, setErrores] = useState([]);

  useEffect(() => {
    if (productoEditar) {
      setForm({
        nombre: productoEditar.nombre || "",
        categoria_id: productoEditar.categoria_id ?? "",
        precio_venta: Number(productoEditar.precio_venta ?? 0),
        stock_minimo: productoEditar.stock_minimo ?? 0,
      });
    } else {
      setForm(estadoInicial);
    }
    setErrores([]);
  }, [productoEditar, abierto]);

  function manejarCambio(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "nombre" ? value : value === "" ? "" : Number(value),
    }));
  }

  function validar() {
    const nuevosErrores = [];

    if (!form.nombre || form.nombre.trim().length < 2) {
      nuevosErrores.push("El nombre debe tener al menos 2 caracteres");
    }

    if (Number(form.precio_venta) < 0 || Number.isNaN(Number(form.precio_venta))) {
      nuevosErrores.push("El precio debe ser un número mayor o igual a 0");
    }

    if (!Number.isInteger(Number(form.stock_minimo)) || Number(form.stock_minimo) < 0) {
      nuevosErrores.push("El stock mínimo debe ser un entero mayor o igual a 0");
    }

    setErrores(nuevosErrores);
    return nuevosErrores.length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validar()) return;

    await onGuardar({
      nombre: form.nombre.trim(),
      categoria_id: form.categoria_id === "" ? null : Number(form.categoria_id),
      precio_venta: Number(form.precio_venta),
      stock_minimo: Number(form.stock_minimo),
    });
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {productoEditar ? "Editar producto" : "Nuevo producto"}
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <InputField
            label="Nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={manejarCambio}
            hideMessage
            placeholder="Ej: Agua mineral 500ml"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoría (opcional)
            </label>
            <select
              name="categoria_id"
              value={form.categoria_id}
              onChange={manejarCambio}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Precio de venta"
              name="precio_venta"
              type="number"
              value={form.precio_venta}
              onChange={manejarCambio}
              hideMessage
              min="0"
              step="0.01"
            />

            <InputField
              label="Stock mínimo (alerta)"
              name="stock_minimo"
              type="number"
              value={form.stock_minimo}
              onChange={manejarCambio}
              hideMessage
              min="0"
            />
          </div>

          {errores.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <ul className="list-disc pl-5">
                {errores.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={cargando}
            >
              {cargando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
