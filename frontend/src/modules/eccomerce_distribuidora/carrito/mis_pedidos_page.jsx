import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { getMisNotasPedido } from "../api/nota_pedido_api.js";
import { ESTADOS, ESTADOS_PAGO } from "../pedidos/estados_pedido.js";

const fmt = (n) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

export default function MisPedidosPage() {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getMisNotasPedido().then(setNotas).catch(() => setNotas([])).finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Mis pedidos</h1>

        {cargando ? (
          <p className="text-center text-sm text-slate-400">Cargando…</p>
        ) : notas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-400">
            Todavía no enviaste ningún pedido.
            <Link to="/distribuidora/catalogo" className="mt-2 block font-semibold text-blue-600">Ver productos</Link>
          </div>
        ) : (
          notas.map((nota) => {
            const estado = ESTADOS[nota.estado] ?? ESTADOS.pendiente;
            const estadoPago = ESTADOS_PAGO[nota.estado_pago] ?? ESTADOS_PAGO.pendiente;
            const saldoPendiente = Number(nota.total) - Number(nota.monto_pagado);
            return (
              <div key={nota.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Package size={16} /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Pedido #{nota.id}</p>
                      <p className="text-xs text-slate-500">{new Date(nota.fecha_alta).toLocaleString("es-AR")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${estadoPago.className}`}>{estadoPago.label}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${estado.className}`}>{estado.label}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-800">{fmt(nota.total)}</p>
                    {saldoPendiente > 0 && <p className="text-[11px] text-slate-400">Saldo: {fmt(saldoPendiente)}</p>}
                  </div>
                </div>
                <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {nota.items?.map((item) => (
                    <p key={item.id}>{item.cantidad} × {item.nombre_producto}{item.variedad_nombre ? ` (${item.variedad_nombre})` : ""}</p>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
