import { cn } from "../../lib/cn";

const VARIANT = {
  default: "border-gray-200 bg-gray-100 text-gray-700",
  blue:    "border-blue-200 bg-blue-100 text-blue-700",
  cyan:    "border-cyan-200 bg-cyan-100 text-cyan-700",
  orange:  "border-orange-200 bg-orange-100 text-orange-700",
  success: "border-emerald-200 bg-emerald-100 text-emerald-700",
  danger:  "border-red-200 bg-red-100 text-red-700",
  warning: "border-amber-200 bg-amber-100 text-amber-700",
  purple:  "border-purple-200 bg-purple-100 text-purple-700",
  green:   "border-green-200 bg-green-100 text-green-700",
  sky:     "border-sky-200 bg-sky-100 text-sky-700",
  indigo:  "border-indigo-200 bg-indigo-100 text-indigo-700",
};

const DOT = {
  default: "bg-gray-400",
  blue:    "bg-blue-500",
  cyan:    "bg-cyan-500",
  orange:  "bg-orange-500",
  success: "bg-emerald-500",
  danger:  "bg-red-500",
  warning: "bg-amber-500",
  purple:  "bg-purple-500",
  green:   "bg-green-500",
  sky:     "bg-sky-500",
  indigo:  "bg-indigo-500",
};

export default function Badge({ label, variant = "default", size = "md", icon: Icon, dot = false, mono = false, className = "" }) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-semibold",
      mono && "font-mono uppercase tracking-[0.18em]",
      sizeClass,
      VARIANT[variant] ?? VARIANT.default,
      className,
    )}>
      {dot   && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT[variant] ?? DOT.default)} />}
      {Icon  && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}
