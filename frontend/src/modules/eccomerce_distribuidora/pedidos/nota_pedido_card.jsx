import { useState } from "react";
import { Package, ChevronDown, ChevronUp, DollarSign, Download, Ban } from "lucide-react";
import { ESTADOS, ESTADOS_PAGO, requierePagoParaEstado } from "./estados_pedido.js";

const fmt = (n) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

function nombrePersona(usuario) {
  const p = usuario?.persona;
  return p ? `${p.nombre} ${p.apellido}` : null;
}

function PagoRow({ pago, onAnular, anulando }) {
  const activo = !pago.anulado_en;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs ${activo ? "bg-slate-50" : "bg-slate-50/50 opacity-60"}`}>
      <div className={activo ? "" : "line-through"}>
        <span className="font-bold text-slate-700">{fmt(pago.monto)}</span>
        <span className="ml-1.5 text-slate-400">
          {nombrePersona(pago.registrado_por_usuario) ?? "—"} · {new Date(pago.registrado_en).toLocaleString("es-AR")}
        </span>
        {pago.nota && <span className="ml-1.5 italic text-slate-400">"{pago.nota}"</span>}
      </div>
      {activo ? (
        <button
          type="button" onClick={() => onAnular(pago.id)} disabled={anulando}
          className="shrink-0 rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
          title="Anular este pago"
        >
          <Ban size={13} />
        </button>
      ) : (
        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
          Anulado {nombrePersona(pago.anulado_por_usuario) ? `por ${nombrePersona(pago.anulado_por_usuario)}` : ""}
        </span>
      )}
    </div>
  );
}

function RegistrarPagoForm({ saldoPendiente, onRegistrar }) {
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await onRegistrar({ monto: montoNum, nota: nota.trim() || null });
      setMonto("");
      setNota("");
    } catch (e2) {
      setError(e2?.response?.data?.mensaje || "No se pudo registrar el pago");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-2 flex flex-wrap items-center gap-2">
      <input
        type="number" min="0.01" step="0.01" placeholder={`Monto (saldo ${fmt(saldoPendiente)})`}
        value={monto} onChange={(e) => setMonto(e.target.value)}
        className="w-44 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
      />
      <input
        type="text" placeholder="Nota (opcional)"
        value={nota} onChange={(e) => setNota(e.target.value)}
        className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
      />
      <button
        type="submit" disabled={enviando}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {enviando ? "Registrando…" : "Registrar pago"}
      </button>
      {error && <p className="w-full text-xs font-semibold text-rose-600">{error}</p>}
    </form>
  );
}

export default function NotaPedidoCard({ nota, onCambiarEstado, onRegistrarPago, onAnularPago, onExportar }) {
  const [abierta, setAbierta] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [anulandoId, setAnulandoId] = useState(null);
  const estado = ESTADOS[nota.estado] ?? ESTADOS.pendiente;
  const estadoPago = ESTADOS_PAGO[nota.estado_pago] ?? ESTADOS_PAGO.pendiente;
  const cliente = nota.usuario?.persona;
  const saldoPendiente = Number(nota.total) - Number(nota.monto_pagado);
  const pagos = nota.pagos ?? [];

  async function anular(pagoId) {
    if (!window.confirm("¿Anular este pago? Va a quedar marcado como anulado, sin borrarse.")) return;
    setAnulandoId(pagoId);
    try {
      await onAnularPago(nota.id, pagoId);
    } finally {
      setAnulandoId(null);
    }
  }

  async function exportar() {
    setExportando(true);
    try {
      await onExportar(nota.id);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setAbierta((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Package size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900">
              {cliente ? `${cliente.nombre} ${cliente.apellido}` : `Pedido #${nota.id}`}
            </p>
            <p className="text-xs text-slate-500">
              {cliente?.email} · {new Date(nota.fecha_alta).toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${estadoPago.className}`}>{estadoPago.label}</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${estado.className}`}>{estado.label}</span>
          <span className="font-bold text-slate-800">{fmt(nota.total)}</span>
          {abierta ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {abierta && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-3 grid grid-cols-1 gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 sm:grid-cols-2">
            <p><span className="font-semibold text-slate-500">Entregar en:</span> {nota.direccion}, {nota.localidad}, {nota.provincia}</p>
            <p>
              <span className="font-semibold text-slate-500">CUIT:</span> {nota.cuit}
              {nota.razon_social && <> — {nota.razon_social}</>}
            </p>
          </div>

          {nota.notas && (
            <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">"{nota.notas}"</p>
          )}

          <div className="space-y-1.5">
            {nota.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {item.cantidad} × {item.nombre_producto}
                  {item.variedad_nombre && <span className="text-slate-400"> ({item.variedad_nombre})</span>}
                </span>
                <span className="font-medium text-slate-600">{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <DollarSign size={14} className="text-slate-400" />
              {fmt(nota.monto_pagado)} pagado de {fmt(nota.total)}
              {saldoPendiente > 0 && <span className="font-normal text-slate-400">— saldo {fmt(saldoPendiente)}</span>}
            </div>

            {pagos.length > 0 && (
              <div className="mt-2 space-y-1">
                {pagos.map((pago) => (
                  <PagoRow key={pago.id} pago={pago} onAnular={anular} anulando={anulandoId === pago.id} />
                ))}
              </div>
            )}

            {saldoPendiente > 0 && (
              <RegistrarPagoForm
                saldoPendiente={saldoPendiente}
                onRegistrar={(payload) => onRegistrarPago(nota.id, payload)}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {Object.keys(ESTADOS).filter((e) => e !== nota.estado).map((e) => {
              const bloqueado = requierePagoParaEstado(e) && nota.estado_pago === "pendiente";
              return (
                <button
                  key={e} type="button" onClick={() => onCambiarEstado(nota.id, e)} disabled={bloqueado}
                  title={bloqueado ? "Este pedido no tiene ningún pago registrado — registrá un pago antes de avanzarlo" : undefined}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${ESTADOS[e].className}`}
                >
                  Marcar como {ESTADOS[e].label.toLowerCase()}
                </button>
              );
            })}
            <button
              type="button" onClick={exportar} disabled={exportando}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              <Download size={13} /> {exportando ? "Exportando…" : "Exportar Excel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
