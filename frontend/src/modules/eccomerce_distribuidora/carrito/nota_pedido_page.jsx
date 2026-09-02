import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Info, X } from "lucide-react";
import { useCarritoDistribuidora } from "./carrito_context.jsx";
import { tieneAlertasCriticas } from "../../../controls/carrito/validations/cart_staleness.js";
import { enviarNotaPedido } from "../api/nota_pedido_api.js";
import PerfilFormModal from "./perfil_form_modal.jsx";

const fmt = (n) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

function AlertaBanner({ icon, tono, titulo, children, onCerrar }) {
  const tonos = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    aviso: "border-amber-200 bg-amber-50 text-amber-700",
  };
  const Icon = icon;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${tonos[tono]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-bold">{titulo}</p>
        <div className="mt-0.5">{children}</div>
      </div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="shrink-0 opacity-60 hover:opacity-100"><X size={14} /></button>
      )}
    </div>
  );
}

export default function NotaPedidoPage() {
  const { items, total, loading, alertas, removeItem, setCantidad, clearCart, limpiarAlertas, recargar } = useCarritoDistribuidora();
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [mostrarPerfil, setMostrarPerfil] = useState(false);

  const hayAlertasCriticas = tieneAlertasCriticas(alertas);

  async function enviar() {
    setEnviando(true);
    setErrorEnvio("");
    try {
      const r = await enviarNotaPedido(notas.trim() || null);
      if (r?.ok === false) {
        if (r.codigo === "PERFIL_INCOMPLETO") { setMostrarPerfil(true); return; }
        setErrorEnvio(r.mensaje);
        return;
      }
      setEnviado(r.data);
      // El backend ya vació el carrito al crear la nota — sincronizamos el
      // contexto (y con eso el badge del ícono en la navbar) con ese estado.
      recargar();
    } catch (e) {
      if (e?.response?.data?.codigo === "PERFIL_INCOMPLETO") { setMostrarPerfil(true); return; }
      setErrorEnvio(e?.response?.data?.mensaje || "No se pudo enviar el pedido");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-400">Cargando pedido…</div>;
  }

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShoppingBag size={26} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">¡Pedido enviado!</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Total: {fmt(enviado.total)} — un empleado va a procesarlo pronto.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/distribuidora/catalogo" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Seguir comprando
            </Link>
            <Link to="/distribuidora/mis-pedidos" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">
              Ver mis pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !alertas.removidos.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Todavía no agregaste productos a tu pedido.</p>
          <Link to="/distribuidora/catalogo" className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Tu pedido</h1>

        {alertas.removidos.length > 0 && (
          <AlertaBanner icon={AlertTriangle} tono="error" titulo="Se quitaron productos que ya no están disponibles">
            {alertas.removidos.map((r) => r.nombre).join(", ")}
          </AlertaBanner>
        )}
        {alertas.variantesInvalidas.length > 0 && (
          <AlertaBanner icon={AlertTriangle} tono="error" titulo="Hay variedades que ya no existen">
            Revisá: {alertas.variantesInvalidas.map((v) => v.nombre).join(", ")}
          </AlertaBanner>
        )}
        {alertas.preciosActualizados.length > 0 && (
          <AlertaBanner icon={Info} tono="aviso" titulo="Cambió el precio de algún producto" onCerrar={limpiarAlertas}>
            {alertas.preciosActualizados.map((p) => `${p.nombre} (${p.subio ? "subió" : "bajó"})`).join(", ")}
          </AlertaBanner>
        )}
        {alertas.stockInsuficiente.length > 0 && (
          <AlertaBanner icon={AlertTriangle} tono="aviso" titulo="Stock insuficiente en algún producto">
            {alertas.stockInsuficiente.map((s) => `${s.nombre} (quedan ${s.stockDisponible})`).join(", ")}
          </AlertaBanner>
        )}
        {errorEnvio && <AlertaBanner icon={AlertTriangle} tono="error" titulo={errorEnvio} />}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div key={item.item_id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  {item.imagen && <img src={item.imagen} alt={item.nombre} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{item.nombre}</p>
                  {item.variante && <p className="text-xs text-slate-500">{item.variante}</p>}
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">{fmt(item.precio)}</p>
                  {item.stock_disponible !== null && item.cantidad > item.stock_disponible && (
                    <p className="text-xs font-semibold text-amber-600">Solo quedan {item.stock_disponible}</p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button type="button" onClick={() => removeItem(item.item_id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-1.5 py-1">
                    <button type="button" onClick={() => setCantidad(item.item_id, item.cantidad - 1)} className="text-slate-500 hover:text-slate-800"><Minus size={13} /></button>
                    <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setCantidad(item.item_id, Math.min(item.cantidad + 1, item.stock_disponible ?? 99))}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={clearCart} className="text-xs font-semibold text-slate-400 hover:text-rose-500">
              Vaciar pedido
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Resumen</h2>
            <div className="mt-3 flex justify-between text-sm text-slate-500">
              <span>{items.length} producto(s)</span>
              <span>{fmt(total)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-base font-extrabold text-slate-900">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            <textarea
              value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas para el pedido (opcional) — ej: horario de entrega"
              rows={2}
              className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
            />

            {hayAlertasCriticas ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                Resolvé los productos no disponibles antes de enviar el pedido.
              </p>
            ) : (
              <button
                type="button" onClick={enviar} disabled={enviando}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Enviar pedido"} <ArrowRight size={15} />
              </button>
            )}

            <Link to="/distribuidora/catalogo" className="mt-3 block text-center text-xs font-semibold text-slate-400 hover:text-blue-600">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>

      {mostrarPerfil && (
        <PerfilFormModal
          onClose={() => setMostrarPerfil(false)}
          onGuardado={() => { setMostrarPerfil(false); enviar(); }}
        />
      )}
    </div>
  );
}
