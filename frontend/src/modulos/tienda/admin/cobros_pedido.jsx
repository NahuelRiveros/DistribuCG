import { useState } from "react";
import { proyecto } from "compartido/proyecto.js";
import { cobroSchema } from "compartido/schemas/tienda.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import { cn } from "@/utils/cn.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { useAnularCobro, useRegistrarCobro } from "../hooks/use_tienda.js";
import { etiquetaMetodo, fechaHora, nombrePersona } from "../utils/presentacion.js";

const METODOS = proyecto.pedidos.metodos_cobro;

/** Cobros del pedido: dinero ya recibido. Un cobro mal cargado se anula con motivo (no se borra). */
export default function CobrosPedido({ pedido }) {
  const toast = useToast();
  const registrar = useRegistrarCobro();
  const anular = useAnularCobro();
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState(METODOS[0].valor);
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [aAnular, setAAnular] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [errorAnular, setErrorAnular] = useState("");
  const puedeCobrar = pedido.estado !== "cancelado" && pedido.saldo > 0;

  async function cobrar(e) {
    e.preventDefault();
    const validacion = cobroSchema.safeParse({ monto: monto || String(pedido.saldo), metodo, nota });
    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }
    setError("");
    try {
      await registrar.mutateAsync({ id: pedido.id, ...validacion.data });
      toast.exito("Cobro registrado");
      setMonto("");
      setNota("");
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  async function confirmarAnulacion(e) {
    e.preventDefault();
    try {
      await anular.mutateAsync({ id: pedido.id, cobroId: aAnular.id, motivo });
      toast.exito("Cobro anulado");
      setAAnular(null);
      setMotivo("");
    } catch (err) {
      setErrorAnular(mensajeDeError(err));
    }
  }

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5" aria-labelledby="titulo-cobros">
      <h2 id="titulo-cobros" className="text-lg font-bold">
        Cobros
      </h2>
      <p className="text-sm text-texto-suave">Registrá el dinero que ya recibiste. Se puede cobrar en partes.</p>

      {pedido.cobros.length > 0 && (
        <ul className="mt-4 divide-y divide-borde text-sm" aria-label="Cobros registrados">
          {pedido.cobros.map((c) => (
            <li key={c.id} className={cn("flex flex-wrap items-center justify-between gap-2 py-2", c.anulado_en && "text-texto-suave")}>
              <div>
                <p className={cn("font-semibold", c.anulado_en && "line-through")}>
                  {formatearDinero(c.monto)} · {etiquetaMetodo(c.metodo)}
                </p>
                <p className="text-xs text-texto-suave">
                  {fechaHora(c.creado_en)} · {nombrePersona(c.registrado_por_usuario)}
                  {c.nota && ` · ${c.nota}`}
                </p>
                {c.anulado_en && (
                  <p className="text-xs">
                    Anulado por {nombrePersona(c.anulado_por_usuario)}: {c.motivo_anulacion}
                  </p>
                )}
              </div>
              {!c.anulado_en && (
                <Boton variante="fantasma" tamano="chico" onClick={() => setAAnular(c)}>
                  Anular
                </Boton>
              )}
            </li>
          ))}
        </ul>
      )}

      {puedeCobrar ? (
        <form onSubmit={cobrar} noValidate className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
          <InputField label="Monto" name="monto" inputMode="decimal" placeholder={String(pedido.saldo).replace(".", ",")} value={monto} onChange={(e) => setMonto(e.target.value)} />
          <SelectField label="Medio" name="metodo" opciones={METODOS} value={metodo} onChange={(e) => setMetodo(e.target.value)} />
          <InputField label="Nota" name="nota" placeholder="Opcional" value={nota} onChange={(e) => setNota(e.target.value)} />
          <Boton type="submit" disabled={registrar.isPending}>
            Registrar cobro
          </Boton>
          <div className="sm:col-span-4">
            <FormError mensaje={error} />
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-texto-suave">{pedido.estado === "cancelado" ? "El pedido está cancelado: no admite cobros nuevos." : "El pedido está cobrado completo."}</p>
      )}

      {aAnular && (
        <Modal abierto onCerrar={() => setAAnular(null)} titulo={`Anular cobro de ${formatearDinero(aAnular.monto)}`} ocupado={anular.isPending}>
          <form onSubmit={confirmarAnulacion} className="space-y-4">
            <InputField label="Motivo" name="motivo_anulacion" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus ayuda="El cobro queda visible como anulado." />
            <FormError mensaje={errorAnular} />
            <div className="flex justify-end gap-3">
              <Boton variante="secundario" onClick={() => setAAnular(null)}>
                Volver
              </Boton>
              <Boton type="submit" variante="peligro" disabled={anular.isPending || motivo.trim().length < 3}>
                Anular cobro
              </Boton>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
