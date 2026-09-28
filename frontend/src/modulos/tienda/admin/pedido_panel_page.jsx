import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";
import { problemaTransicion } from "compartido/reglas/pedido_transiciones.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { useCambiarEstado, usePedidoPanel } from "../hooks/use_tienda.js";
import { EntregaPedido, EstadoPedido, HistorialPedido, ItemsPedido } from "../componentes/detalle_pedido.jsx";
import { estadoPedido, fechaHora, numeroPedido } from "../utils/presentacion.js";
import CobrosPedido from "./cobros_pedido.jsx";

const { transiciones, motivo_requerido } = proyecto.pedidos;

/** Botones con los cambios de estado permitidos desde el estado actual (proyecto.config.js). */
function AccionesEstado({ pedido }) {
  const toast = useToast();
  const cambiar = useCambiarEstado();
  const [destino, setDestino] = useState(null); // estado elegido que pide motivo
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  async function aplicar(estado, conMotivo) {
    setError("");
    try {
      // estado_actual: si otra persona lo cambió mientras tanto, el servidor avisa.
      await cambiar.mutateAsync({ id: pedido.id, estado, motivo: conMotivo || undefined, estado_actual: pedido.estado });
      toast.exito(`Pedido ${numeroPedido(pedido.id)}: ${estadoPedido(estado).etiqueta}`);
      setDestino(null);
      setMotivo("");
    } catch (e) {
      if (destino) setError(mensajeDeError(e));
      else toast.error(mensajeDeError(e));
    }
  }

  const posibles = transiciones[pedido.estado] ?? [];
  if (posibles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Cambiar estado">
      {posibles.map((estado) => {
        const pideMotivo = motivo_requerido.includes(`${pedido.estado}:${estado}`);
        return (
          <Boton
            key={estado}
            variante={estado === "cancelado" ? "secundario" : "primario"}
            tamano="chico"
            disabled={cambiar.isPending}
            onClick={() => (pideMotivo ? setDestino(estado) : aplicar(estado))}
          >
            {estado === "cancelado" ? "Cancelar pedido" : `Pasar a “${estadoPedido(estado).etiqueta}”`}
          </Boton>
        );
      })}

      {destino && (
        <Modal abierto onCerrar={() => setDestino(null)} titulo={`Pasar a “${estadoPedido(destino).etiqueta}”`} ocupado={cambiar.isPending}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const problema = problemaTransicion({ desde: pedido.estado, hacia: destino, motivo, estadoCobro: pedido.estado_cobro });
              if (problema) setError(problema);
              else aplicar(destino, motivo);
            }}
            className="space-y-4"
          >
            <InputField label="Motivo" name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus ayuda="Queda en el historial del pedido." />
            <FormError mensaje={error} />
            <div className="flex justify-end gap-3">
              <Boton variante="secundario" onClick={() => setDestino(null)}>
                Volver
              </Boton>
              <Boton type="submit" disabled={cambiar.isPending}>
                Confirmar
              </Boton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function PedidoPanelPage() {
  const { id } = useParams();
  const pedido = usePedidoPanel(id);

  if (pedido.isPending) return <Cargando />;
  if (pedido.isError) return <ErrorCarga error={pedido.error} onReintentar={pedido.refetch} />;
  const p = pedido.data;

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-texto">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Pedidos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-titulos text-2xl font-bold">Pedido {numeroPedido(p.id)}</h1>
            <EstadoPedido pedido={p} />
          </div>
          <p className="text-sm text-texto-suave">Recibido el {fechaHora(p.creado_en)}</p>
        </div>
        <AccionesEstado pedido={p} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <ItemsPedido pedido={p} />
          <CobrosPedido pedido={p} />
        </div>
        <div className="space-y-6">
          <EntregaPedido pedido={p} />
          <HistorialPedido pedido={p} mostrarUsuario />
        </div>
      </div>
    </div>
  );
}
