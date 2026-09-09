import { Link } from "react-router-dom";
import { Package, Trash2 } from "lucide-react";
import QuantityInput from "../ui/quantity_input.jsx";
export default function CartItem({ item, to, formatPrice, maxQuantity, onQuantity, onRemove, disabled }) {
  return <article className="grid grid-cols-[48px_minmax(0,1fr)_44px] items-start gap-3 rounded-2xl border border-(--kt-border) bg-white p-3">
    <Link to={to} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
      {item.imagen ? <img src={item.imagen} alt="" className="h-full w-full object-contain" /> : <Package size={24} />}</Link>
    <div className="min-w-0"><Link to={to} className="text-sm font-bold hover:underline">{item.nombre}</Link><p className="text-xs text-slate-500">{item.variante || "Unidad"}</p><p className="text-sm">{formatPrice(item.precio)} por unidad</p></div>
    <button type="button" aria-label={`Quitar ${item.nombre}`} disabled={disabled} onClick={onRemove} className="flex h-11 w-11 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={18} /></button>
    <div className="col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-(--kt-border) pt-3">
      <QuantityInput label={`Cantidad de ${item.nombre}`} value={item.cantidad} onChange={onQuantity} max={Math.min(maxQuantity, item.stock_disponible ?? maxQuantity)} disabled={disabled || item.activo === false || item.variante_disponible === false || item.stock_disponible === 0} />
      <p className="text-base font-bold">{formatPrice(item.precio * item.cantidad)}</p>
    </div>
    {(!item.activo || !item.variante_disponible || item.stock_disponible != null && item.cantidad > item.stock_disponible) && <p className="col-span-3 text-sm text-rose-700">Revisá la disponibilidad o quitá este producto.</p>}
  </article>;
}
