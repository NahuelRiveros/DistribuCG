import { Wrench, Construction } from "lucide-react";

export default function UnderConstruction({
  title    = "Sección en construcción",
  subtitle = "Esta funcionalidad estará disponible próximamente.",
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-yellow-100 text-yellow-600">
            <Construction className="h-7 w-7" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Estamos trabajando en esta sección.
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Wrench className="h-4 w-4" />
          <span>Dynamic Gym · En desarrollo</span>
        </div>
      </div>
    </div>
  );
}
