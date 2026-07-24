import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Campo de búsqueda unificado del sistema RAV.
 * Controlado o no-controlado, con botón de limpiar opcional.
 *
 * Uso:
 *   {/* Controlado *\/}
 *   <SearchInput value={busqueda} onChange={setBusqueda} />
 *
 *   {/* Con placeholder y sin clearable *\/}
 *   <SearchInput
 *     value={q}
 *     onChange={setQ}
 *     placeholder="Buscar por nombre..."
 *     clearable={false}
 *   />
 *
 * Props:
 *   value       — string — valor actual (controlado)
 *   onChange    — (value: string) => void
 *   placeholder — texto placeholder
 *   clearable   — boolean — muestra botón X para limpiar (default: true)
 *   className   — clases extra en el input
 *   wrapperClassName — clases extra en el contenedor
 */
export default function SearchInput({
  value = "",
  onChange,
  placeholder = "Buscar...",
  clearable = true,
  className = "",
  wrapperClassName = "",
}) {
  const hasValue = value && value.length > 0;

  return (
    <div className={cn("relative flex-1", wrapperClassName)}>
      {/* Ícono lupa */}
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "w-full rounded-2xl border border-cyan-400/30 bg-white/[0.07]",
          "py-2.5 pl-10 pr-4 text-sm text-white outline-none",
          "placeholder:text-slate-500 transition duration-200",
          "hover:border-cyan-400/40 hover:bg-white/10",
          "focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/25",
          clearable && hasValue && "pr-9",
          className
        )}
      />

      {/* Botón limpiar */}
      {clearable && hasValue && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
