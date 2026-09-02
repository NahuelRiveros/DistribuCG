import { useState } from "react";
import { Image, Type, Layers, Contact } from "lucide-react";
import GaleriaTab from "./home/galeria_tab.jsx";
import TextosTab from "./home/textos_tab.jsx";
import PilaresTab from "./home/pilares_tab.jsx";
import ContactoTab from "./home/contacto_tab.jsx";

const TABS = [
  { id: "galeria",  label: "Galería",  icon: Image,   Componente: GaleriaTab },
  { id: "textos",   label: "Textos",   icon: Type,    Componente: TextosTab },
  { id: "pilares",  label: "Pilares",  icon: Layers,  Componente: PilaresTab },
  { id: "contacto", label: "Contacto", icon: Contact, Componente: ContactoTab },
];

export default function HomeConfigPage() {
  const [tab, setTab] = useState("galeria");
  const TabActiva = TABS.find((t) => t.id === tab)?.Componente ?? GaleriaTab;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-[var(--kt-turquoise-border)] bg-white shadow-sm shadow-[var(--kt-turquoise)]/10">
          <div className="h-1 w-full bg-linear-to-r from-(--kt-teal-700) via-[var(--kt-petrol)] to-[var(--kt-turquoise)]" />
          <div className="px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--kt-teal-700) px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              <Image size={11} />
              Admin
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Contenido del home</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Todo lo que se ve en la página pública, editable acá: galería, textos, pilares y contacto.
            </p>
          </div>

          {/* ── PESTAÑAS ── */}
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 pt-2">
            {TABS.map(({ id, label, icon }) => {
              const Icon = icon;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                    tab === id
                      ? "bg-slate-50 text-(--kt-teal-700)"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <TabActiva />

      </div>
    </div>
  );
}
