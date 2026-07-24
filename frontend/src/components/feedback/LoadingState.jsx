import { cn } from "../../lib/cn";

const MIN_HEIGHT = { sm: "min-h-[100px]", md: "min-h-[160px]", lg: "min-h-[280px]" };

export default function LoadingState({ message = "Cargando...", minHeight = "md", className = "" }) {
  return (
    <div role="status" aria-label={message}
      className={cn("flex items-center justify-center p-8", MIN_HEIGHT[minHeight] ?? MIN_HEIGHT.md, className)}>
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <span className="inline-flex items-end gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
        </span>
        <span className="text-sm text-gray-500">{message}</span>
      </div>
    </div>
  );
}
