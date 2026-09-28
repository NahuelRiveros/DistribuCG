import { useState } from "react";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import CheckboxField from "@/componentes/ui/checkbox_field.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import { useConfigurarStock } from "../hooks/use_stock.js";
import { nombreExistencia } from "../utils/presentacion.js";

export default function ConfigurarModal({ existencia, onCerrar }) {
  const toast = useToast();
  const configurar = useConfigurarStock();
  const [controla, setControla] = useState(existencia.controla_stock);
  const [minimo, setMinimo] = useState(String(existencia.minimo));
  const [error, setError] = useState("");

  async function guardar(e) {
    e.preventDefault();
    const valorMinimo = Number(minimo);
    if (!Number.isInteger(valorMinimo) || valorMinimo < 0) {
      setError("El mínimo tiene que ser un número entero, 0 o más.");
      return;
    }
    try {
      await configurar.mutateAsync({ variante_id: existencia.variante_id, controla_stock: controla, minimo: valorMinimo });
      toast.exito("Configuración guardada");
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Configurar · ${nombreExistencia(existencia)}`} ocupado={configurar.isPending}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        <CheckboxField
          label="Controlar stock"
          name="controla_stock"
          checked={controla}
          onChange={(e) => setControla(e.target.checked)}
          ayuda="Sin control, se vende sin límite y no se registran movimientos (útil si el stock lo lleva otro sistema)."
        />
        <InputField
          label="Stock mínimo"
          name="minimo"
          type="number"
          min={0}
          value={minimo}
          onChange={(e) => setMinimo(e.target.value)}
          ayuda="Al llegar a esta cantidad aparece como “Stock bajo” (en la tienda, “Últimas unidades”)."
        />
        <FormError mensaje={error} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={configurar.isPending}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={configurar.isPending}>
            Guardar
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
