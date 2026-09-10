import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/auth_context.jsx";
import { storefrontConfig } from "../../../config/storefront_config.js";
import OrderSummary from "../../../controls/pedidos/order_summary.jsx";
import { money } from "../../../controls/pedidos/order_format.js";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import ActionButton from "../../../controls/ui/action_button.jsx";
import { getMisNotasPedido } from "../api/nota_pedido_api.js";
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
      {query.data?.map((nota) => <article key={nota.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div><h2 className="font-bold">Pedido #{nota.id}</h2><p className="text-xs text-slate-500">{new Date(nota.fecha_alta).toLocaleString("es-AR")}</p></div>
          <OrderSummary order={nota} />
        </div>
        <details className="border-t pt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">Ver productos y entrega</summary>
          <ul className="space-y-2 text-sm">{nota.items?.map((item) => <li className="flex flex-wrap justify-between gap-2" key={item.id}><span>{item.cantidad} × {item.nombre_producto}{item.variedad_nombre ? " (" + item.variedad_nombre + ")" : ""}</span><span>{money(item.subtotal)}</span></li>)}</ul>
          <p className="mt-3 break-words text-sm">Entrega: {[nota.direccion, nota.localidad, nota.departamento, nota.provincia, nota.codigo_postal].filter(Boolean).join(", ")}</p>
          {nota.notas && <p className="mt-2 whitespace-pre-wrap break-words text-sm">Observaciones: {nota.notas}</p>}
        </details>
      </article>)}
    </div>
  </main>;
}
