import { Link } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";
import ActionButton from "../ui/action_button.jsx";
export default function ProductCard({ name, brand, image, to, price, presentation, unavailable, onAdd, busy, message, error, availability }) {
  return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-(--kt-border) bg-white shadow-sm">
    <Link to={to} className="relative flex aspect-square items-center justify-center overflow-hidden bg-(--kt-bg-soft)">
      {image ? <img src={image} alt={name} loading="lazy" decoding="async" className="h-full w-full object-contain p-3" /> : <Package size={36} className="text-slate-400" />}
      {unavailable && <span className="absolute left-2 top-2 rounded-lg bg-white px-2 py-1 text-xs font-bold">Sin stock</span>}
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
      {brand && <p className="truncate text-xs font-semibold text-slate-500">{brand}</p>}
      <Link to={to} className="line-clamp-2 text-sm font-bold hover:underline">{name}</Link>
      <p className="text-xs text-slate-500">{presentation}</p>
      <div className="mt-auto pt-2"><p className="text-base font-extrabold sm:text-lg">{price}</p><p className="text-xs text-slate-500">{availability}</p></div>
      {onAdd ? <ActionButton onClick={onAdd} disabled={busy || unavailable} className="w-full !px-2"><ShoppingBag size={16} />{unavailable ? "Sin stock" : busy ? "Agregando…" : "Agregar"}</ActionButton>
        : <Link to={to} className="flex min-h-11 items-center justify-center rounded-xl border border-(--kt-border) px-2 text-sm font-semibold">Ver opciones</Link>}
      {(message || error) && <p role={error ? "alert" : "status"} className={`text-xs ${error ? "text-rose-700" : "text-emerald-700"}`}>{error || message}</p>}
    </div>
  </article>;
}
