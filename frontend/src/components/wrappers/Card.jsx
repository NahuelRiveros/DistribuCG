import { cn } from "../../lib/cn";

const PADDING = { none: "", sm: "p-4 sm:p-5", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

export default function Card({ children, padding = "md", className = "" }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border border-gray-200 bg-white",
        "shadow-sm",
        PADDING[padding] ?? PADDING.md,
        className
      )}
    >
      {children}
    </div>
  );
}
