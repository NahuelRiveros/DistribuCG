import { useEffect, useState } from "react";
import { Package, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { getTodasLasNotasPedido, cambiarEstadoNotaPedido, cambiarPagoNotaPedido } from "../api/nota_pedido_api.js";

const ESTADOS = {
  pendiente: { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  en_curso:  { label: "En curso",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  entregado: { label: "Entregado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelada: { label: "Cancelada", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

const fmt = (n) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

function NotaCard({ nota, onCambiarEstado, onCambiarPago }) {
  const [abierta, setAbierta] = useState(false);
  const estado = ESTADOS[nota.estado] ?? ESTADOS.pendiente;
  const cliente = nota.usuario?.persona;

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
          {nota.pagado && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <DollarSign size={10} /> Pagado
            </span>
          )}
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

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(ESTADOS).filter((e) => e !== nota.estado).map((e) => (
              <button key={e} type="button" onClick={() => onCambiarEstado(nota.id, e)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold hover:opacity-80 ${ESTADOS[e].className}`}>
                Marcar como {ESTADOS[e].label.toLowerCase()}
              </button>
            ))}
            <button
              type="button" onClick={() => onCambiarPago(nota.id, !nota.pagado)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold hover:opacity-80 ${
                nota.pagado ? "border-slate-200 bg-slate-50 text-slate-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {nota.pagado ? "Marcar como no pagado" : "Marcar como pagado"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotasPedidoDistribuidoraPage() {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setNotas(await getTodasLasNotasPedido());
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudieron cargar los pedidos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(id, estado) {
    try {
      await cambiarEstadoNotaPedido(id, estado);
      await cargar();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo actualizar el estado");
    }
  }

  async function cambiarPago(id, pagado) {
    try {
      await cambiarPagoNotaPedido(id, pagado);
      await cargar();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo actualizar el pago");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Notas de pedido</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Pedidos enviados por los clientes — sin pasarela de pago online, el estado y el pago se marcan acá manualmente.
          </p>
        </div>

        <ErrorBanner message={error} />

        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
            Cargando pedidos…
          </div>
        ) : notas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-400">
            Todavía no llegó ningún pedido.
          </div>
        ) : (
          <div className="space-y-3">
            {notas.map((nota) => (
              <NotaCard key={nota.id} nota={nota} onCambiarEstado={cambiarEstado} onCambiarPago={cambiarPago} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
