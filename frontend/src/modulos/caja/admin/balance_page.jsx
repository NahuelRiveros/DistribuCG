import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import { MESES } from "compartido/reglas/fechas.js";
import Boton from "@/componentes/ui/boton.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { mensajeDeError } from "@/api/http.js";
import { descargarArchivo } from "@/utils/descargar.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { cn } from "@/utils/cn.js";
import { exportarAnio } from "../api/caja_api.js";
import { useBalanceAnual } from "../hooks/use_caja.js";
import { saldoTexto } from "../utils/presentacion.js";
import GraficoAnual from "./grafico_anual.jsx";
import PorCategoria from "./por_categoria.jsx";
import TarjetasTotales from "./tarjetas_totales.jsx";

export default function BalancePage() {
  const [params, setParams] = useSearchParams();
  const anioElegido = params.get("anio") ? Number(params.get("anio")) : undefined;
  const balance = useBalanceAnual(anioElegido);
  const toast = useToast();
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    try {
      descargarArchivo(await exportarAnio(balance.data.anio), `caja-${balance.data.anio}.xlsx`);
    } catch (error) {
      toast.error(mensajeDeError(error, "No pudimos generar el Excel."));
    } finally {
      setExportando(false);
    }
  }

  if (balance.isPending) return <Cargando texto="Cargando balance..." />;
  if (balance.isError) return <ErrorCarga error={balance.error} onReintentar={balance.refetch} />;
  const { anio, anios, meses, totales, por_categoria } = balance.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulos text-2xl font-bold">Balance anual</h1>
          <p className="text-sm text-texto-suave">Incluye los cobros de pedidos y los movimientos cargados en la caja.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <SelectField
              name="anio"
              aria-label="Año"
              opciones={anios.map((a) => ({ valor: String(a), etiqueta: String(a) }))}
              value={String(anio)}
              onChange={(e) => setParams({ anio: e.target.value })}
              className="mt-0"
            />
          </div>
          <Boton variante="secundario" onClick={exportar} disabled={exportando}>
            <Download className="h-4 w-4" aria-hidden="true" /> {exportando ? "Generando..." : "Exportar a Excel"}
          </Boton>
        </div>
      </header>

      <TarjetasTotales totales={totales} etiquetaSaldo={`Saldo ${anio}`} />
      <GraficoAnual anio={anio} meses={meses} />

      <section aria-labelledby="tabla-meses">
        <h2 id="tabla-meses" className="mb-3 text-lg font-bold">
          Mes a mes
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-borde bg-fondo text-xs uppercase tracking-wide text-texto-suave">
              <tr>
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3 text-right">Ingresos</th>
                <th className="px-4 py-3 text-right">Egresos</th>
                <th className="px-4 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {meses.map((m) => (
                <tr key={m.mes} className="hover:bg-fondo/60">
                  <td className="px-4 py-2.5">
                    <Link to={`/admin/caja/calendario?anio=${anio}&mes=${m.mes}`} className="font-medium text-primario hover:underline">
                      {MESES[m.mes - 1]}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatearDinero(m.ingresos)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatearDinero(m.egresos)}</td>
                  <td className={cn("px-4 py-2.5 text-right font-semibold tabular-nums", m.saldo < 0 && "text-peligro")}>{saldoTexto(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-borde font-bold">
              <tr>
                <td className="px-4 py-3">Total {anio}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatearDinero(totales.ingresos)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatearDinero(totales.egresos)}</td>
                <td className={cn("px-4 py-3 text-right tabular-nums", totales.saldo < 0 && "text-peligro")}>{saldoTexto(totales.saldo)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <PorCategoria porCategoria={por_categoria} totales={totales} />
    </div>
  );
}
