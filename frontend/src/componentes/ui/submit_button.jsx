import { cn } from "@/utils/cn.js";

// Traído de DistribuCG, con colores del tema en vez de fijos.
export default function SubmitButton({ children, cargando = false, textoCargando = "Procesando...", disabled = false, className = "" }) {
  return (
    <button
      type="submit"
      disabled={disabled || cargando}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-2.5 font-semibold text-primario-texto",
        "transition hover:bg-primario-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {cargando ? textoCargando : children}
    </button>
  );
}
