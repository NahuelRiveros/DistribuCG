import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { useAuth } from "../../../core/auth/auth_context.jsx";
import ErrorBanner from "../../../core/controls/ui/error_banner.jsx";
import ActionButton from "../../../core/controls/ui/action_button.jsx";
import { clientConfig } from "../../../../../proyecto/client_config.js";
import { orderConfig, ESTADOS } from "../config/order_config.js";
import { storefrontConfig } from "../storefront_config.js";
import OrderSummary from "../pedidos/controles/order_summary.jsx";
import { money } from "../pedidos/controles/order_format.js";
import { PASOS_CLIENTE, linkWhatsapp, queSigue } from "../pedidos/controles/mensajes_estado.js";
import PagoTransferencia from "../pedidos/pago_transferencia.jsx";
import { cancelarMiNotaPedido, getMiNotaPedido } from "../api/nota_pedido_api.js";
import { useCarritoDistribuidora } from "./carrito_context.jsx";
import CancelarPedidoModal from "./cancelar_pedido_modal.jsx";

const fecha = (valor) => new Date(valor).toLocaleString("es-AR");

/** PED-76: un pedido del cliente: en qué paso va, qué sigue, el cobro, cancelar e historial. */
export default function MiPedidoPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const cart = useCarritoDistribuidora();
  const [cancelando, setCancelando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const clave = ["mi-pedido", usuario?.usuario_id, id];
  // Se actualiza al volver a la pestaña: sin consultas periódicas.
  const query = useQuery({ queryKey: clave, queryFn: () => getMiNotaPedido(id), refetchOnWindowFocus: true, retry: (n, error) => error?.response?.status !== 404 && n < 1 });
  const cancelar = useMutation({
    mutationFn: (datos) => cancelarMiNotaPedido(id, datos),
    onSuccess: async (respuesta, { volverAlCarrito }) => {
      setCancelando(false);
      setAviso({ mensaje: respuesta.mensaje, omitidos: respuesta.omitidos ?? [], volverAlCarrito });
      if (volverAlCarrito) await cart.recargar().catch(() => {});
    },
    onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: clave }), queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] })]),
  });
  const nota = query.data;
  const noExiste = query.error?.response?.status === 404;
  const entrega = nota && [nota.direccion, nota.localidad, nota.departamento, nota.provincia, nota.codigo_postal].filter(Boolean).join(", ");

  return <main className="min-h-screen bg-slate-50 px-3 py-6 sm:p-8">
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to={storefrontConfig.ordersPath} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft size={16} aria-hidden="true" /> Mis pedidos</Link>
      {query.isPending && <div role="status" aria-label="Cargando el pedido" className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />}
      {noExiste && <div className="rounded-2xl border border-dashed bg-white p-8 text-center"><h1 className="text-xl font-bold">No encontramos ese pedido</h1><Link className="mt-3 inline-flex min-h-11 items-center font-bold underline" to={storefrontConfig.ordersPath}>Ver mis pedidos</Link></div>}
      {query.isError && !noExiste && <div className="space-y-3"><ErrorBanner message="No pudimos cargar el pedido." /><ActionButton onClick={() => query.refetch()}>Reintentar</ActionButton></div>}
      {nota && <>
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:justify-between">
          <div><h1 className="text-2xl font-extrabold">Pedido #{nota.id}</h1><p className="text-xs text-slate-500">{fecha(nota.fecha_alta)}</p></div>
          <OrderSummary order={nota} />
        </header>

        {aviso && <div role="status" className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">{aviso.mensaje}</p>
          {aviso.omitidos.length > 0 && <>
            <p>Algunos productos no volvieron completos porque ya no hay disponibilidad:</p>
            <ul className="list-disc pl-5">{aviso.omitidos.map((o, i) => <li key={i}>{o.nombre}: pediste {o.pedido}, {o.cargado ? `cargamos ${o.cargado}` : "no se pudo cargar"}</li>)}</ul>
          </>}
          {aviso.volverAlCarrito && <Link className="inline-flex min-h-11 items-center font-bold underline" to={storefrontConfig.cartPath}>Ir al carrito</Link>}
        </div>}

        <section aria-label="Avance del pedido" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <Pasos estado={nota.estado} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{queSigue(nota.estado)}</p>
            {clientConfig.whatsapp && <a href={linkWhatsapp(clientConfig.whatsapp, `¡Hola! Te escribo por mi pedido #${nota.id}.`)} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1E7A46] px-4 text-sm font-bold text-[#1E7A46] hover:bg-emerald-50">
              <MessageCircle size={17} aria-hidden="true" /> Consultar por WhatsApp
            </a>}
          </div>
        </section>

        <section aria-label="Productos y entrega" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-bold">Productos</h2>
          <ul className="divide-y text-sm">{nota.items?.map((item) => <li className="flex flex-wrap justify-between gap-2 py-2" key={item.id}><span className="min-w-0 break-words">{item.cantidad} × {item.nombre_producto}{item.variedad_nombre ? " (" + item.variedad_nombre + ")" : ""}</span><span>{money(item.subtotal)}</span></li>)}</ul>
          {entrega && <p className="break-words text-sm">Entrega: {entrega}</p>}
          {nota.notas && <p className="whitespace-pre-wrap break-words text-sm">Observaciones: {nota.notas}</p>}
        </section>

        {(nota.estado !== "cancelada" || nota.comprobantes?.length > 0) && <div className="rounded-2xl border border-slate-200 bg-white p-4"><PagoTransferencia nota={nota} comprobantes={nota.comprobantes ?? []} onSubido={() => queryClient.invalidateQueries({ queryKey: clave })} /></div>}

        {orderConfig.buyerCancelableStates.includes(nota.estado) && <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Podés cancelarlo o cambiarlo hasta que lo confirmemos.</p>
          <button type="button" onClick={() => { cancelar.reset(); setAviso(null); setCancelando(true); }} className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50">Cancelar o cambiar pedido</button>
        </div>}

        {nota.historial_estados?.length > 0 && <section aria-label="Historial del pedido" className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-bold">Historial</h2>
          <ol className="space-y-2 border-l-2 border-slate-200 pl-4 text-sm">{(nota.historial_estados ?? []).map((h) => <li key={h.id}>
            <span className="font-semibold">{ESTADOS[h.nuevo]?.label ?? h.nuevo}</span><span className="text-slate-500"> · {fecha(h.fecha)}</span>
            {h.motivo && <p className="break-words text-slate-600">{h.motivo}</p>}
          </li>)}</ol>
        </section>}
      </>}
    </div>
    {cancelando && nota && <CancelarPedidoModal nota={nota} busy={cancelar.isPending}
      error={cancelar.error ? cancelar.error.response?.data?.mensaje || "No se pudo cancelar el pedido. Reintentá." : ""}
      onClose={() => setCancelando(false)} onCancelar={(datos) => cancelar.mutate(datos)} />}
  </main>;
}

/** Recibido → Confirmado → En preparación → Entregado; cancelado se avisa aparte. */
function Pasos({ estado }) {
  if (estado === "cancelada") return <p className="rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-700">Este pedido está cancelado.</p>;
  const actual = PASOS_CLIENTE.indexOf(estado);
  return <ol className="grid grid-cols-4 gap-1" aria-label="Pasos del pedido">
    {PASOS_CLIENTE.map((paso, i) => <li key={paso} aria-current={i === actual ? "step" : undefined} className="text-center">
      <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${i <= actual ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-500"}`}>
        {i < actual ? <Check size={15} aria-hidden="true" /> : i + 1}
      </span>
      <span className={`mt-1.5 block text-[11px] leading-tight sm:text-xs ${i === actual ? "font-bold text-slate-900" : "text-slate-500"}`}>{ESTADOS[paso]?.label}</span>
    </li>)}
  </ol>;
}
