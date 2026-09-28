import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ingresoSchema } from "compartido/schemas/stock.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SearchField from "@/componentes/ui/search_field.jsx";
import { Vacio } from "@/componentes/ui/estado_carga.jsx";
import { useExistencias, useRegistrarIngreso } from "../hooks/use_stock.js";
import { nombreExistencia } from "../utils/presentacion.js";

/** Carga de un remito: varias presentaciones con su cantidad y (opcional) costo. */
export default function IngresoPage() {
  const toast = useToast();
  const registrar = useRegistrarIngreso();
  const [busqueda, setBusqueda] = useState("");
  const resultados = useExistencias({ q: busqueda, limite: 8 }, { enabled: busqueda.length >= 2 });
  const [lineas, setLineas] = useState([]);
  const [referencia, setReferencia] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");

  function agregar(e) {
    if (lineas.some((l) => l.existencia.variante_id === e.variante_id)) {
      toast.info("Esa presentación ya está en la lista: cambiale la cantidad.");
      return;
    }
    setLineas((actuales) => [...actuales, { existencia: e, cantidad: "", costo: "" }]);
    setBusqueda("");
  }
  const cambiar = (i, campo, valor) => setLineas((actuales) => actuales.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  async function guardar(e) {
    e.preventDefault();
    const datos = {
      items: lineas.map((l) => ({ variante_id: l.existencia.variante_id, cantidad: l.cantidad, costo_unitario: l.costo })),
      referencia,
      motivo: observacion,
    };
    const validacion = ingresoSchema.safeParse(datos);
    if (!validacion.success) {
      const issue = validacion.error.issues[0];
      const fila = issue.path[0] === "items" && typeof issue.path[1] === "number" ? ` (fila ${issue.path[1] + 1})` : "";
      setError(issue.message + fila);
      return;
    }
    setError("");
    try {
      const resultado = await registrar.mutateAsync(validacion.data);
      toast.exito(`Ingreso registrado: ${resultado.unidades} unidades en ${resultado.movimientos} presentación(es)`);
      setLineas([]);
      setReferencia("");
      setObservacion("");
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  const encontrados = resultados.data?.existencias ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-titulos text-2xl font-bold">Ingreso de mercadería</h1>
      <p className="text-sm text-texto-suave">Cargá lo que llegó (por ejemplo, un remito). Si una presentación no controlaba stock, se activa sola.</p>

      <form onSubmit={guardar} noValidate className="mt-6 space-y-5">
        <section className="space-y-3 rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="font-bold">Productos</h2>
          <div className="relative">
            <SearchField valor={busqueda} onBuscar={setBusqueda} etiqueta="Buscar producto para agregar" placeholder="Escribí el nombre o el código" demora={250} />
            {busqueda.length >= 2 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-borde bg-superficie shadow-lg" aria-label="Resultados">
                {encontrados.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-texto-suave">{resultados.isFetching ? "Buscando..." : "Sin resultados"}</li>
                ) : (
                  encontrados.map((e) => (
                    <li key={e.variante_id}>
                      <button type="button" onClick={() => agregar(e)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-fondo">
                        <span>
                          {nombreExistencia(e)}
                          {e.sku && <span className="ml-2 text-xs text-texto-suave">{e.sku}</span>}
                        </span>
                        <Plus className="h-4 w-4 shrink-0 text-primario" aria-hidden="true" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {lineas.length === 0 ? (
            <Vacio titulo="Todavía no agregaste productos" texto="Buscalos arriba por nombre o código." />
          ) : (
            <ol className="space-y-2" aria-label="Productos del ingreso">
              {lineas.map((l, i) => (
                <li key={l.existencia.variante_id} className="grid items-end gap-3 rounded-xl border border-borde p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <div>
                    <p className="font-semibold">{nombreExistencia(l.existencia)}</p>
                    <p className="text-xs text-texto-suave">Hoy: {l.existencia.controla_stock ? l.existencia.cantidad : "sin control"}</p>
                  </div>
                  <InputField label="Cantidad" name={`cantidad_${i}`} type="number" min={1} inputMode="numeric" value={l.cantidad} onChange={(e) => cambiar(i, "cantidad", e.target.value)} />
                  <InputField label="Costo unitario" name={`costo_${i}`} inputMode="decimal" placeholder="Opcional" value={l.costo} onChange={(e) => cambiar(i, "costo", e.target.value)} />
                  <Boton variante="fantasma" tamano="icono" onClick={() => setLineas((a) => a.filter((_, j) => j !== i))} aria-label={`Quitar ${nombreExistencia(l.existencia)}`}>
                    <Trash2 className="h-4 w-4 text-peligro" />
                  </Boton>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="grid gap-4 rounded-2xl border border-borde bg-superficie p-5 sm:grid-cols-2">
          <InputField label="Remito o factura" name="referencia" placeholder="Ej: R-0001-00012345" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          <InputField label="Observación" name="observacion" placeholder="Opcional" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </section>

        <FormError mensaje={error} />
        <div className="flex justify-end">
          <Boton type="submit" disabled={registrar.isPending || lineas.length === 0}>
            {registrar.isPending ? "Registrando..." : "Registrar ingreso"}
          </Boton>
        </div>
      </form>
    </div>
  );
}
