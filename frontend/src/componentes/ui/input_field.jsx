import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn.js";

// Adaptado de DistribuCG (controls/ui/input_field.jsx): la validación la hace el
// schema Zod del formulario; este componente solo muestra el campo y su error.
export default function InputField({
  label,
  name,
  register,
  error,
  ayuda,
  type = "text",
  placeholder = "",
  autoComplete,
  required = false,
  disabled = false,
  mostrarContrasena = false,
  icon: Icon,
  className = "",
  ...resto
}) {
  const [visible, setVisible] = useState(false);
  const idGenerado = useId();
  const id = resto.id ?? `${name}-${idGenerado}`;
  const idMensaje = `${id}-mensaje`;
  const mensaje = error ?? ayuda;
  const esContrasena = type === "password";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-texto">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-peligro">*</span>}
        </label>
      )}

      <div className="relative mt-1 flex items-center">
        {Icon && <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-texto-suave" aria-hidden="true" />}
        <input
          id={id}
          type={esContrasena && visible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={mensaje ? idMensaje : undefined}
          className={cn(
            "w-full rounded-xl border bg-superficie px-3 py-2 text-texto outline-none transition placeholder:text-texto-suave/70",
            "focus:border-primario focus:ring-2 focus:ring-primario/20",
            error ? "border-peligro" : "border-borde",
            disabled && "cursor-not-allowed opacity-60",
            Icon && "pl-9",
            esContrasena && mostrarContrasena && "pr-11",
            className,
          )}
          {...(register ? register(name) : { name })}
          {...resto}
        />
        {esContrasena && mostrarContrasena && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-lg text-texto-suave hover:text-texto"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {mensaje && (
        <p id={idMensaje} className={cn("mt-1 text-sm", error ? "text-peligro" : "text-texto-suave")}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
