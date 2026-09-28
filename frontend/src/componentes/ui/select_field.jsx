import { useId } from "react";
import { cn } from "@/utils/cn.js";

/** opciones: [{ valor, etiqueta, deshabilitada? }] */
export default function SelectField({ label, name, register, error, opciones = [], placeholder, required = false, className = "", ...resto }) {
  const id = `${name}-${useId()}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-peligro">*</span>}
        </label>
      )}
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-1 w-full rounded-xl border bg-superficie px-3 py-2 text-texto outline-none focus:border-primario focus:ring-2 focus:ring-primario/20",
          error ? "border-peligro" : "border-borde",
          className,
        )}
        {...(register ? register(name) : { name })}
        {...resto}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor} disabled={o.deshabilitada}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}
