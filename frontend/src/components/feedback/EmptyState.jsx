import { Inbox } from "lucide-react";
import { cn } from "../../lib/cn";

const MIN_HEIGHT = { sm: "min-h-[120px]", md: "min-h-[200px]", lg: "min-h-[300px]" };

export default function EmptyState({ icon: Icon = Inbox, title = "Sin resultados", description, action, minHeight = "md", className = "" }) {
  return (
    <div className={cn("flex items-center justify-center p-8", MIN_HEIGHT[minHeight] ?? MIN_HEIGHT.md, className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-600">{title}</p>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>

        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
