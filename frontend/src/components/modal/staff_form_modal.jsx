import { useEffect } from "react";
import { useForm } from "react-hook-form";
import InputField from "../form/input_field.jsx";

const valoresIniciales = {
  nombre: "",
  apellido: "",
  email: "",
  documento: "",
  password: "",
};

export default function StaffFormModal({
  abierto,
  onClose,
  onGuardar,
  staffEditar = null,
  cargando = false,
}) {
  const esEdicion = Boolean(staffEditar);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: valoresIniciales,
  });

  useEffect(() => {
    if (!abierto) return;

    if (staffEditar) {
      reset({
        nombre: staffEditar.gym_persona_nombre || "",
        apellido: staffEditar.gym_persona_apellido || "",
        email: staffEditar.gym_persona_email || "",
        documento: staffEditar.gym_persona_documento || "",
        password: "",
      });
    } else {
      reset(valoresIniciales);
    }
  }, [abierto, staffEditar, reset]);

  function validar(data) {
    let valido = true;

    if (!data.nombre?.trim()) {
      setError("nombre", { type: "manual", message: "El nombre es obligatorio" });
      valido = false;
    }

    if (!data.apellido?.trim()) {
      setError("apellido", { type: "manual", message: "El apellido es obligatorio" });
      valido = false;
    }

    if (!data.email?.trim()) {
      setError("email", { type: "manual", message: "El email es obligatorio" });
      valido = false;
    }

    if (!data.documento?.trim()) {
      setError("documento", { type: "manual", message: "El documento es obligatorio" });
      valido = false;
    } else if (!/^\d+$/.test(String(data.documento).trim())) {
      setError("documento", {
        type: "manual",
        message: "El documento debe contener solo números",
      });
      valido = false;
    }

    if (!esEdicion) {
      if (!data.password?.trim()) {
        setError("password", {
          type: "manual",
          message: "La contraseña es obligatoria",
        });
        valido = false;
      } else if (String(data.password).trim().length < 4) {
        setError("password", {
          type: "manual",
          message: "La contraseña debe tener al menos 4 caracteres",
        });
        valido = false;
      }
    }

    return valido;
  }

  async function submit(data) {
    if (!validar(data)) return;

    const payload = {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      email: data.email.trim().toLowerCase(),
      documento: String(data.documento).trim(),
    };

    if (!esEdicion) {
      payload.password = String(data.password).trim();
    }

    await onGuardar(payload);
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="border-b border-blue-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {esEdicion ? "Editar staff" : "Nuevo staff"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {esEdicion
              ? "Modificá los datos generales del usuario."
              : "Creá un nuevo usuario con rol staff."}
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Nombre"
              name="nombre"
              register={register}
              error={errors.nombre?.message}
              placeholder="Ej: Juan"
            />

            <InputField
              label="Apellido"
              name="apellido"
              register={register}
              error={errors.apellido?.message}
              placeholder="Ej: Pérez"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Email"
              name="email"
              register={register}
              error={errors.email?.message}
              placeholder="Ej: juan.staff@gym.com"
              type="email"
              autoComplete="email"
            />

            <InputField
              label="Documento"
              name="documento"
              register={register}
              error={errors.documento?.message}
              placeholder="Solo números"
              inputMode="numeric"
            />
          </div>

          {!esEdicion && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Contraseña"
                name="password"
                register={register}
                error={errors.password?.message}
                placeholder="Mínimo 4 caracteres"
                type="password"
                autoComplete="new-password"
              />
            </div>
          )}

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
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}