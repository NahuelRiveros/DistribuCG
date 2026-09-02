import { useEffect, useState } from "react";
import InputField from "../../../../controls/ui/input_field.jsx";

const estadoInicial = {
  descripcion: "",
  dias_totales: 0,
  ingresos: 0,
  precio: 0,
};

export default function PlanFormModal({
  abierto,
  onClose,
  onGuardar,
  planEditar = null,
  cargando = false,
}) {
  const [form, setForm] = useState(estadoInicial);
  const [errores, setErrores] = useState([]);

  useEffect(() => {
    if (planEditar) {
      setForm({
        descripcion: planEditar.descripcion || "",
        dias_totales: planEditar.dias_totales ?? 0,
        ingresos: planEditar.ingresos ?? 0,
        precio: Number(planEditar.precio ?? 0),
      });
    } else {
      setForm(estadoInicial);
    }
    setErrores([]);
  }, [planEditar, abierto]);

  function manejarCambio(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "descripcion"
          ? value
          : value === ""
          ? ""
          : Number(value),
    }));
  }

  function validar() {
    const nuevosErrores = [];

    if (!form.descripcion || form.descripcion.trim().length < 3) {
      nuevosErrores.push("La descripción debe tener al menos 3 caracteres");
    }

    if (!Number.isInteger(Number(form.dias_totales)) || Number(form.dias_totales) < 0) {
      nuevosErrores.push("Los días totales deben ser un entero mayor o igual a 0");
    }

    if (!Number.isInteger(Number(form.ingresos)) || Number(form.ingresos) < 0) {
      nuevosErrores.push("Los ingresos deben ser un entero mayor o igual a 0");
    }

    if (Number(form.precio) < 0 || Number.isNaN(Number(form.precio))) {
      nuevosErrores.push("El precio debe ser un número mayor o igual a 0");
    }

    setErrores(nuevosErrores);
    return nuevosErrores.length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validar()) return;

    await onGuardar({
      descripcion: form.descripcion.trim(),
      dias_totales: Number(form.dias_totales),
      ingresos: Number(form.ingresos),
      precio: Number(form.precio),
    });
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {planEditar ? "Editar plan" : "Nuevo plan"}
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <InputField
            label="Descripción"
            name="descripcion"
            type="text"
            value={form.descripcion}
            onChange={manejarCambio}
            hideMessage
            placeholder="Ej: Mensual 3 días por semana"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InputField
              label="Días totales"
              name="dias_totales"
              type="number"
              value={form.dias_totales}
              onChange={manejarCambio}
              hideMessage
              min="0"
            />

            <InputField
              label="Ingresos"
              name="ingresos"
              type="number"
              value={form.ingresos}
              onChange={manejarCambio}
              hideMessage
              min="0"
            />

            <InputField
              label="Precio"
              name="precio"
              type="number"
              value={form.precio}
              onChange={manejarCambio}
              hideMessage
              min="0"
              step="0.01"
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