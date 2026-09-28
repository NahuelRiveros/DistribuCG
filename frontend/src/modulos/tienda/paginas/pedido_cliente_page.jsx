import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import DatosTransferencia from "@/componentes/pagos/datos_transferencia.jsx";
import { usePagos } from "@/hooks/use_pagos.js";
import { usePedido } from "../hooks/use_tienda.js";
import { EntregaPedido, EstadoPedido, HistorialPedido, ItemsPedido } from "../componentes/detalle_pedido.jsx";
import { fechaHora, numeroPedido } from "../utils/presentacion.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";

// El CBU se muestra mientras quede algo por pagar de un pedido vigente que se paga por transferencia.
const debeTransferir = (p) => p.medio_pago === "transferencia" && p.estado_cobro !== "cobrado" && p.estado !== "cancelado";

export default function PedidoClientePage() {
  const { id } = useParams();
  const pedido = usePedido(id);
  const { data: pagos } = usePagos();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/mis-pedidos" className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-texto">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mis pedidos
      </Link>
      {pedido.isPending ? (
        <Cargando />
      ) : pedido.isError ? (
        <ErrorCarga error={pedido.error} onReintentar={pedido.refetch} />
      ) : (
        <>
          <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-titulos text-3xl font-bold">Pedido {numeroPedido(pedido.data.id)}</h1>
            <EstadoPedido pedido={pedido.data} />
          </div>
          <p className="-mt-4 mb-6 text-sm text-texto-suave">Enviado el {fechaHora(pedido.data.creado_en)}</p>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <ItemsPedido pedido={pedido.data} />
            <div className="space-y-6">
              {debeTransferir(pedido.data) && pagos && (
                <DatosTransferencia
                  datos={pagos.datos_transferencia}
                  titulo={`Transferí ${formatearDinero(pedido.data.saldo)} a esta cuenta`}
                  className="border-primario bg-primario/5"
                />
              )}
              <EntregaPedido pedido={pedido.data} />
              <HistorialPedido pedido={pedido.data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
