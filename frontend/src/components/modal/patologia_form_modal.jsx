import { useEffect } from "react";
import { useForm } from "react-hook-form";
import InputField from "../form/input_field.jsx";

export default function PatologiaFormModal({ abierto, onClose, onGuardar, patologiaEditar = null, cargando = false }) {
  const esEdicion = Boolean(patologiaEditar);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { descripcion: "" } });

  useEffect(() => {
    if (!abierto) return;
    reset({ descripcion: patologiaEditar?.descripcion || "" });
  }, [abierto, patologiaEditar, reset]);

  async function submit(data) {
    const descripcion = data.descripcion?.trim();
    if (!descripcion) {
      setError("descripcion", { type: "manual", message: "La descripción es obligatoria" });
      return;
    }
    await onGuardar({ descripcion });
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-(--kt-teal-700)/15 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {esEdicion ? "Editar patología" : "Nueva patología"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {esEdicion ? "Modificá la descripción de la patología." : "Se suma al catálogo para elegir al agregar pacientes."}
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 px-6 py-5">
          <InputField
            label="Descripción"
            name="descripcion"
            register={register}
            error={errors.descripcion?.message}
            placeholder="Ej: Lumbalgia"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="rounded-xl bg-(--kt-teal-700) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear patología"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
