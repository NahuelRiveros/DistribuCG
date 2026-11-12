import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../../../core/auth/auth_context.jsx";
import { storefrontConfig } from "../storefront_config.js";
import OrderSummary from "../pedidos/controles/order_summary.jsx";
import { queSigue } from "../pedidos/controles/mensajes_estado.js";
import ErrorBanner from "../../../core/controls/ui/error_banner.jsx";
import ActionButton from "../../../core/controls/ui/action_button.jsx";
import { getMisNotasPedido } from "../api/nota_pedido_api.js";

/** PED-76: resumen de los pedidos del cliente; el detalle (cobro, cancelar, historial) está en cada pedido. */
export default function MisPedidosPage() {
  const { usuario } = useAuth();
  const query = useQuery({ queryKey: ["mis-pedidos", usuario?.usuario_id], queryFn: getMisNotasPedido, refetchInterval: 30000 });
  return <main className="min-h-screen bg-slate-50 px-3 py-6 sm:p-8">
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Mis pedidos</h1><ActionButton disabled={query.isFetching} onClick={() => query.refetch()}>Actualizar</ActionButton></div>
      <p className="text-sm text-slate-600">{storefrontConfig.labels.orderNotice}</p>
      {query.isError && <ErrorBanner message="No pudimos actualizar tus pedidos. Reintentá con Actualizar." />}
      {query.isPending && <p role="status">Cargando pedidos…</p>}
      {query.data?.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center"><p>Todavía no enviaste ningún pedido.</p><Link className="mt-3 inline-flex min-h-11 items-center font-bold underline" to={storefrontConfig.catalogPath}>Ver productos</Link></div>}
      {query.data?.map((nota) => <article key={nota.id} className="rounded-2xl border border-slate-200 bg-white">
        <Link to={`${storefrontConfig.ordersPath}/${nota.id}`} aria-label={`Ver pedido #${nota.id}`} className="flex flex-col gap-3 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-bold">Pedido #{nota.id}</h2>
            <p className="text-xs text-slate-500">{new Date(nota.fecha_alta).toLocaleString("es-AR")} · {nota.items?.length ?? 0} {nota.items?.length === 1 ? "producto" : "productos"}</p>
            <p className="mt-1 text-sm text-slate-700">{queSigue(nota.estado)}</p>
          </div>
          <div className="flex items-center justify-between gap-3"><OrderSummary order={nota} /><ChevronRight size={20} className="shrink-0 text-slate-400" aria-hidden="true" /></div>
        </Link>
      </article>)}
    </div>
  </main>;
}
