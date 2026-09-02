import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, DollarSign } from "lucide-react";
import { getMisNotasPedido } from "../api/nota_pedido_api.js";

const ESTADOS = {
  pendiente: { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  en_curso:  { label: "En curso",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  entregado: { label: "Entregado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelada: { label: "Cancelada", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

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
            <Link to="/distribuidora/catalogo" className="mt-2 block font-semibold text-blue-600">Ir al catálogo</Link>
          </div>
        ) : (
          notas.map((nota) => {
            const estado = ESTADOS[nota.estado] ?? ESTADOS.pendiente;
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
                      {nota.pagado && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <DollarSign size={9} /> Pagado
                        </span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${estado.className}`}>{estado.label}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-800">{fmt(nota.total)}</p>
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
