import { cn } from "../../lib/cn";

const VARIANT = {
  default: "border-gray-200 bg-gray-50",
  blue:    "border-blue-200 bg-blue-50",
  success: "border-emerald-200 bg-emerald-50",
  danger:  "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  purple:  "border-purple-200 bg-purple-50",
  orange:  "border-orange-200 bg-orange-50",
};

const PADDING = { none: "", sm: "p-3", md: "p-4", lg: "p-5 sm:p-6" };

export default function Panel({ children, variant = "default", padding = "md", className = "" }) {
  return (
    <div className={cn("rounded-xl border", VARIANT[variant] ?? VARIANT.default, PADDING[padding] ?? PADDING.md, className)}>
      {children}
    </div>
  );
}
