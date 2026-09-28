import { useState } from "react";
import { ajusteSchema, motivosAjuste } from "compartido/schemas/stock.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import { cn } from "@/utils/cn.js";
import { useRegistrarAjuste } from "../hooks/use_stock.js";
import { nombreExistencia } from "../utils/presentacion.js";

const MODOS = [
  { valor: "fijar", etiqueta: "Conté y hay…", ayuda: "Cargá la cantidad que contaste: se registra solo la diferencia." },
  { valor: "sumar", etiqueta: "Sumar", ayuda: "Aparecieron unidades que no estaban registradas." },
  { valor: "restar", etiqueta: "Restar", ayuda: "Rotura, vencimiento, faltante…" },
];
const OTRO = "Otro";

export default function AjusteModal({ existencia, onCerrar }) {
  const toast = useToast();
  const ajustar = useRegistrarAjuste();
  const [modo, setModo] = useState("fijar");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState(motivosAjuste[0]);
  const [motivoOtro, setMotivoOtro] = useState("");
  const [error, setError] = useState("");

  const numero = Number(cantidad);
  const valido = cantidad !== "" && Number.isInteger(numero) && numero >= 0;
  const queda = !valido ? null : modo === "fijar" ? numero : modo === "sumar" ? existencia.cantidad + numero : existencia.cantidad - numero;

  async function guardar(e) {
    e.preventDefault();
    const validacion = ajusteSchema.safeParse({ variante_id: existencia.variante_id, modo, cantidad, motivo: motivo === OTRO ? motivoOtro : motivo });
    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }
    try {
      const resultado = await ajustar.mutateAsync(validacion.data);
      toast.exito(`Stock ajustado: quedan ${resultado.saldo_cantidad}`);
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Ajustar stock · ${nombreExistencia(existencia)}`} ocupado={ajustar.isPending}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        <p className="text-sm text-texto-suave">
          Registrado: <strong className="text-texto">{existencia.cantidad}</strong>
          {existencia.reservado > 0 && ` (${existencia.reservado} reservadas para pedidos)`}
        </p>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de ajuste">
          {MODOS.map((m) => (
            <button
              key={m.valor}
              type="button"
              role="radio"
              aria-checked={modo === m.valor}
              onClick={() => setModo(m.valor)}
              className={cn(
                "rounded-xl border px-2 py-2 text-sm font-semibold",
                modo === m.valor ? "border-primario bg-primario/10 text-primario" : "border-borde text-texto-suave",
              )}
            >
              {m.etiqueta}
            </button>
          ))}
        </div>
        <p className="text-xs text-texto-suave">{MODOS.find((m) => m.valor === modo).ayuda}</p>

        <InputField
          label={modo === "fijar" ? "Cantidad contada" : "Cantidad"}
          name="cantidad"
          type="number"
          min={0}
          inputMode="numeric"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          ayuda={queda != null ? `Queda: ${queda}` : undefined}
          error={queda != null && queda < existencia.reservado ? "No puede quedar menos que lo reservado para pedidos" : undefined}
          autoFocus
        />
        <SelectField label="Motivo" name="motivo" opciones={motivosAjuste.map((m) => ({ valor: m, etiqueta: m }))} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        {motivo === OTRO && <InputField label="Detalle del motivo" name="motivo_otro" value={motivoOtro} onChange={(e) => setMotivoOtro(e.target.value)} />}

        <FormError mensaje={error} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={ajustar.isPending}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={ajustar.isPending || !valido}>
            {ajustar.isPending ? "Guardando..." : "Registrar ajuste"}
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
