import { useState } from "react";
import { ajustePreciosSchema } from "compartido/schemas/catalogo.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import { cn } from "@/utils/cn.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import CategoriaSelect from "../componentes/categoria_select.jsx";
import { useAjustarPrecios } from "../hooks/use_catalogo.js";
import { precioVisible } from "../utils/precios.js";

// Adaptado de DistribuCG (ajuste_precios_modal.jsx): ahora con vista previa antes de aplicar.
export default function AjustePreciosModal({ categorias, onCerrar }) {
  const toast = useToast();
  const ajustar = useAjustarPrecios();
  const [alcance, setAlcance] = useState("categoria");
  const [categoriaId, setCategoriaId] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [confirmaTodo, setConfirmaTodo] = useState(false);
  const [vista, setVista] = useState(null);
  const [error, setError] = useState("");

  const datos = {
    porcentaje,
    categoria_id: alcance === "categoria" ? categoriaId : undefined,
    todo_el_catalogo: alcance === "todo",
  };

  // Cualquier cambio invalida la vista previa: hay que volver a verla antes de aplicar.
  const cambiar = (setter) => (valor) => {
    setter(valor);
    setVista(null);
    setError("");
  };

  async function enviar(simular) {
    const validacion = ajustePreciosSchema.safeParse({ ...datos, simular });
    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }
    if (!simular && alcance === "todo" && !confirmaTodo) {
      setError("Tildá la confirmación para cambiar los precios de todo el catálogo.");
      return;
    }
    setError("");
    try {
      const resultado = await ajustar.mutateAsync(validacion.data);
      if (simular) {
        setVista(resultado);
      } else {
        toast.exito(`Se actualizaron ${resultado.cantidad} precio(s)`);
        onCerrar();
      }
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }

  const botonAlcance = (valor, texto) => (
    <button
      type="button"
      onClick={() => cambiar(setAlcance)(valor)}
      aria-pressed={alcance === valor}
      className={cn("flex-1 rounded-xl border px-3 py-2 text-sm font-semibold", alcance === valor ? "border-primario bg-primario/10 text-primario" : "border-borde text-texto-suave")}
    >
      {texto}
    </button>
  );

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Ajuste masivo de precios" ocupado={ajustar.isPending}>
      <div className="space-y-4">
        <div className="flex gap-2" role="group" aria-label="Alcance">
          {botonAlcance("categoria", "Una categoría")}
          {botonAlcance("todo", "Todo el catálogo")}
        </div>

        {alcance === "categoria" && (
          <CategoriaSelect
            label="Categoría"
            name="categoria_ajuste"
            categorias={categorias}
            placeholder="Elegí una categoría"
            value={categoriaId}
            onChange={(e) => cambiar(setCategoriaId)(e.target.value)}
          />
        )}
        <InputField
          label="Porcentaje"
          name="porcentaje"
          inputMode="decimal"
          placeholder="Ej: 10 para subir, -5 para bajar"
          value={porcentaje}
          onChange={(e) => cambiar(setPorcentaje)(e.target.value)}
          ayuda={alcance === "categoria" ? "Incluye las subcategorías. El precio de oferta se ajusta igual." : "El precio de oferta se ajusta igual."}
        />

        {vista && (
          <div className="rounded-xl border border-borde bg-fondo p-3 text-sm" aria-live="polite">
            <p className="font-semibold">Se van a actualizar {vista.cantidad} presentación(es).</p>
            {vista.ejemplos.length > 0 && (
              <table className="mt-2 w-full text-left">
                <caption className="sr-only">Ejemplos del cambio</caption>
                <thead className="text-xs text-texto-suave">
                  <tr>
                    <th className="py-1">Producto</th>
                    <th className="py-1">Hoy</th>
                    <th className="py-1">Queda</th>
                  </tr>
                </thead>
                <tbody>
                  {vista.ejemplos.map((e, i) => (
                    <tr key={i} className="border-t border-borde">
                      <td className="py-1">
                        {e.producto}
                        {e.presentacion ? ` · ${e.presentacion}` : ""}
                      </td>
                      <td className="py-1">{formatearDinero(precioVisible(e.antes, e.iva_porcentaje))}</td>
                      <td className="py-1 font-semibold">{formatearDinero(precioVisible(e.despues, e.iva_porcentaje))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vista && alcance === "todo" && (
          <label className="flex items-start gap-2 rounded-xl bg-peligro/10 p-3 text-sm text-peligro">
            <input type="checkbox" checked={confirmaTodo} onChange={(e) => setConfirmaTodo(e.target.checked)} className="mt-0.5" />
            Sí, quiero cambiar los precios de TODO el catálogo.
          </label>
        )}

        <FormError mensaje={error} />
        <div className="flex flex-wrap justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={ajustar.isPending}>
            Cancelar
          </Boton>
          {vista ? (
            <Boton onClick={() => enviar(false)} disabled={ajustar.isPending || vista.cantidad === 0}>
              {ajustar.isPending ? "Aplicando..." : `Aplicar a ${vista.cantidad}`}
            </Boton>
          ) : (
            <Boton onClick={() => enviar(true)} disabled={ajustar.isPending}>
              {ajustar.isPending ? "Calculando..." : "Ver vista previa"}
            </Boton>
          )}
        </div>
      </div>
    </Modal>
  );
}
