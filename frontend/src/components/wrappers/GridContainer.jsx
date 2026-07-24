import { cn } from "../../lib/cn";

const COLS = {
  1:    "grid-cols-1",
  2:    "grid-cols-1 sm:grid-cols-2",
  3:    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4:    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  auto: "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
};
const GAP   = { sm: "gap-3", md: "gap-4", lg: "gap-6", xl: "gap-8" };
const ALIGN = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };

export default function GridContainer({ children, cols = 2, gap = "md", align = "stretch", className = "" }) {
  return (
    <div className={cn("grid", COLS[cols] ?? COLS[2], GAP[gap] ?? GAP.md, ALIGN[align] ?? ALIGN.stretch, className)}>
      {children}
    </div>
  );
}
