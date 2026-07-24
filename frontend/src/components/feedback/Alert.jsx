import { X } from "lucide-react";
import { cn } from "../../lib/cn";

const VARIANT = {
  info:    { wrap: "border-blue-200 bg-blue-50",    text: "text-blue-800",    icon: "text-blue-600"    },
  success: { wrap: "border-emerald-200 bg-emerald-50", text: "text-emerald-800", icon: "text-emerald-600" },
  danger:  { wrap: "border-red-200 bg-red-50",      text: "text-red-800",     icon: "text-red-600"     },
  warning: { wrap: "border-amber-200 bg-amber-50",  text: "text-amber-800",   icon: "text-amber-600"   },
};

export default function Alert({ variant = "info", title, message, icon: Icon, onClose, className = "" }) {
  const cls = VARIANT[variant] ?? VARIANT.info;

  return (
    <div role="alert" className={cn("rounded-xl border px-4 py-3.5", cls.wrap, className)}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cls.icon)} />}

        <div className="flex-1 min-w-0">
          {title   && <p className={cn("text-sm font-semibold", cls.text)}>{title}</p>}
          {message && <p className={cn("text-sm", cls.text, title && "mt-0.5 opacity-85")}>{message}</p>}
        </div>

        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar alerta"
            className={cn("shrink-0 transition opacity-60 hover:opacity-100", cls.icon)}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
