import { useEffect, useState } from "react";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import {
  getTodasLasNotasPedido, cambiarEstadoNotaPedido,
  registrarPagoNotaPedido, anularPagoNotaPedido, exportarNotaPedido,
} from "../api/nota_pedido_api.js";
import NotaPedidoCard from "./nota_pedido_card.jsx";

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

  // Deja que el error se propague — RegistrarPagoForm (nota_pedido_card.jsx)
  // lo muestra inline junto al formulario en vez de en el banner general.
  async function registrarPago(id, payload) {
    await registrarPagoNotaPedido(id, payload);
    await cargar();
  }

  async function anularPago(id, pagoId) {
    try {
      await anularPagoNotaPedido(id, pagoId);
      await cargar();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo anular el pago");
    }
  }

  async function exportar(id) {
    try {
      await exportarNotaPedido(id);
    } catch {
      setError("No se pudo exportar el pedido");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Notas de pedido</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Pedidos enviados por los clientes — sin pasarela de pago online, el estado y los pagos se registran acá manualmente.
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
              <NotaPedidoCard
                key={nota.id} nota={nota}
                onCambiarEstado={cambiarEstado}
                onRegistrarPago={registrarPago}
                onAnularPago={anularPago}
                onExportar={exportar}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
