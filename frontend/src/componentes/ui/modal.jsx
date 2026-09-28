import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn.js";

// Traído de DistribuCG: <dialog> nativo (foco atrapado, Escape y devolución del foco).
export default function Modal({ abierto = true, onCerrar, titulo, children, ocupado = false, className = "" }) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!abierto || !dialogo) return;
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialogo.close();
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) onCerrar();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !ocupado) onCerrar();
      }}
      className={cn(
        "m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-borde bg-superficie p-0 text-texto shadow-xl backdrop:bg-slate-950/50",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-borde p-4">
        <h2 id={idTitulo} className="text-lg font-bold">
          {titulo}
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          disabled={ocupado}
          onClick={onCerrar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-fondo"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
