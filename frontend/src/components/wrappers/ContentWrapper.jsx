import { cn } from "../../lib/cn";

const WIDTH = { xs: "max-w-xs", sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl", full: "max-w-full" };
const GAP   = { sm: "gap-3", md: "gap-5", lg: "gap-8" };

export default function ContentWrapper({ children, maxWidth = "full", center = false, stack = false, gap = "md", className = "" }) {
  return (
    <div className={cn("w-full", WIDTH[maxWidth] ?? WIDTH.full, center && "mx-auto", stack && "flex flex-col", stack && (GAP[gap] ?? GAP.md), className)}>
      {children}
    </div>
  );
}
