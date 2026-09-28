import { cn } from "@/utils/cn.js";

const TONOS = {
  exito: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  aviso: "bg-amber-50 text-amber-800 ring-amber-200",
  peligro: "bg-red-50 text-red-700 ring-red-200",
  neutro: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default function Insignia({ tono = "neutro", children }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", TONOS[tono])}>{children}</span>;
}
