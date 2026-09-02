import { useState } from "react";
import { Tag, Ruler, Palette, Truck, Crown } from "lucide-react";
import MarcasTab     from "./tabs/marcas_tab.jsx";
import CategoriasTab from "./tabs/categorias_tab.jsx";
import ColoresTab    from "./tabs/colores_tab.jsx";
import TallesTab     from "./tabs/talles_tab.jsx";
import EnvioTab      from "./tabs/envio_tab.jsx";

const TABS = [
  { id: "marcas",     label: "Marcas",     icon: Crown,   desc: "Marcas disponibles en el catálogo" },
  { id: "categorias", label: "Categorías", icon: Tag,     desc: "Categorías y subcategorías de productos" },
  { id: "colores",    label: "Colores",    icon: Palette, desc: "Paleta de colores disponible" },
  { id: "talles",     label: "Talles",     icon: Ruler,   desc: "Talles o medidas — dejar vacío si no aplica" },
  { id: "envio",      label: "Envío",      icon: Truck,   desc: "Opciones y tarifas de envío" },
];

export default function AdminCatalogsPage() {
  const [tab, setTab] = useState("marcas");
  const active = TABS.find((t) => t.id === tab);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      <div className="mb-6 flex items-start gap-3">
        <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-slate-900" />
        <div>
          <h1 className="text-2xl font-black text-slate-900">Catálogos</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Marcas, categorías, colores, talles y opciones de envío del catálogo.
          </p>
        </div>
      </div>

      <div className="mb-5 overflow-x-auto">
        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                tab === id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs font-medium text-slate-500">{active?.desc}</p>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        {tab === "marcas"     && <MarcasTab />}
        {tab === "categorias" && <CategoriasTab />}
        {tab === "colores"    && <ColoresTab />}
        {tab === "talles"     && <TallesTab />}
        {tab === "envio"      && <EnvioTab />}
      </div>
    </div>
  );
}
