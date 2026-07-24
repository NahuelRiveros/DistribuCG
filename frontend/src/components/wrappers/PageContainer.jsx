import { cn } from "../../lib/cn";

const SIZE = { sm: "max-w-2xl", md: "max-w-4xl", lg: "max-w-7xl", xl: "max-w-screen-2xl", full: "max-w-full" };
const GAP  = { sm: "space-y-4", md: "space-y-6", lg: "space-y-8" };

export default function PageContainer({ children, size = "lg", gap = "md", className = "" }) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", SIZE[size] ?? SIZE.lg, GAP[gap] ?? GAP.md, className)}>
      {children}
    </div>
  );
}
