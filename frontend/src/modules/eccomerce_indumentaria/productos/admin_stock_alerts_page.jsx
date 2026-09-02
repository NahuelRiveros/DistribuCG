import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, RefreshCw, Package, ExternalLink,
  CheckCircle2, XCircle,
} from "lucide-react";
import { getStockBajo } from "./producto_api.js";
import AdminSpinner from "../../../controls/ui/admin_spinner.jsx";
import AdminStatCard from "../../../controls/ui/admin_stat_card.jsx";
import AdminEmptyState from "../../../controls/ui/admin_empty_state.jsx";

function fmtHora(d) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function SeveridadBadge({ stock }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-600">
        <XCircle size={11} /> Agotado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
      <AlertTriangle size={11} /> Bajo stock
    </span>
  );
}

function StockBadge({ stock }) {
  const cls = stock === 0 ? "bg-rose-500 text-white" : "bg-amber-400 text-amber-900";
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${cls}`}>
      {stock}
    </span>
  );
}

function AlertRow({ item }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="w-28 shrink-0">
        <SeveridadBadge stock={item.stock} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-sm font-bold text-slate-900">{item.producto_nombre}</p>
          {item.marca && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {item.marca}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {item.variante ? (
            <span className="text-xs text-slate-500">
              Variante: <span className="font-semibold text-slate-900">{item.variante}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">Sin variante</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StockBadge stock={item.stock} />
        <span className="hidden text-[10px] text-slate-500 sm:block">uds.</span>
      </div>
      <Link
        to={`/admin/productos/${item.producto_id}/editar`}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
        title="Editar producto"
      >
        <ExternalLink size={11} />
        <span className="hidden sm:inline">Reponer</span>
      </Link>
    </div>
  );
}

function AlertSection({ title, items, colorClass, dotClass }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <div className={`flex items-center gap-2.5 border-b border-slate-200 px-5 py-3.5 ${colorClass}`}>
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold tabular-nums">
          {items.length}
        </span>
      </div>
      <div>
        {items.map((item, i) => (
          <AlertRow key={`${item.producto_id}-${item.variante ?? ""}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function AdminStockAlertsPage() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [spinning,  setSpinning]  = useState(false);

  const load = useCallback(async () => {
    setSpinning(true);
    setError(false);
    try {
      const data = await getStockBajo(1);
      setItems(data);
      setUpdatedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const agotados = items.filter((i) => i.stock === 0);
  const criticos = items.filter((i) => i.stock === 1);
  const total    = items.length;

  if (loading) return <AdminSpinner fullPage />;

  return (
    <div className="p-6 lg:p-8">

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle size={22} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Log de stock bajo</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Productos con ≤ 1 unidad disponible — requieren reposición
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-slate-500">Actualizado a las {fmtHora(updatedAt)}</span>
          )}
          <button onClick={load} disabled={spinning}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:shadow-sm disabled:opacity-60">
            <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          No se pudo obtener el log de stock. Verificá que el endpoint{" "}
          <code className="rounded bg-rose-100 px-1 font-mono text-xs">/productos/stock-bajo</code>{" "}
          esté disponible en el backend.
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminStatCard icon={XCircle}       iconBg="bg-rose-100"  iconColor="text-rose-500"  label="Agotados"        value={agotados.length} valueClass="text-3xl font-black text-rose-500"  sub="Stock en 0 unidades" />
        <AdminStatCard icon={AlertTriangle} iconBg="bg-amber-100" iconColor="text-amber-500" label="Bajo stock"      value={criticos.length} valueClass="text-3xl font-black text-amber-500" sub="Stock en 1 unidad"   />
        <AdminStatCard icon={Package}       iconBg="bg-slate-100" iconColor="text-slate-700" label="Total a reponer" value={total}           valueClass="text-3xl font-black text-slate-900" sub="Productos afectados" />
      </div>

      {total === 0 && !error ? (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <AdminEmptyState
            icon={CheckCircle2}
            title="Todo en orden"
            description="No hay productos con stock bajo o agotado"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <AlertSection title="Agotados — Stock 0" items={agotados} colorClass="bg-rose-50 text-rose-700" dotClass="bg-rose-500" />
          <AlertSection title="Bajo stock — Stock 1" items={criticos} colorClass="bg-amber-50 text-amber-700" dotClass="bg-amber-500" />
        </div>
      )}
    </div>
  );
}
