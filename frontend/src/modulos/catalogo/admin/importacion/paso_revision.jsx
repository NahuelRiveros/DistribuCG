import { Download } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";

const ACCIONES = {
  crear: { etiqueta: "Crear", tono: "exito" },
  actualizar: { etiqueta: "Actualizar", tono: "info" },
  sin_cambios: { etiqueta: "Sin cambios", tono: "neutro" },
  omitir: { etiqueta: "Omitir", tono: "neutro" },
  error: { etiqueta: "Con error", tono: "peligro" },
};

export default function PasoRevision({ asistente, onCancelar }) {
  const { importacion: imp, ejecutando, ocupado, omitirErrores } = asistente;
  const terminada = imp.estado === "completado";
  const cancelada = imp.estado === "cancelado";
  const empezada = imp.siguiente_lote > 0;
  const cuentas = terminada || cancelada ? { ...imp.resultado, total: imp.resumen.total } : imp.resumen;
  const faltaAceptarErrores = !empezada && imp.resumen.error > 0 && !omitirErrores;
  const conStock = imp.muestra.some((f) => f.stock != null);
  const titulos = ["Fila", "Código", "Producto", "Acción", "Precio actual", "Precio nuevo", ...(conStock ? ["Stock"] : []), "Detalle"];

  let estado = "Pendiente de confirmación. Todavía no se cargó nada.";
  if (ejecutando) estado = "Cargando... Podés pausar: se detiene al terminar el lote actual.";
  else if (terminada) estado = `Listo. Productos nuevos: ${imp.resultado.productos_nuevos ?? 0} · Categorías nuevas: ${imp.resultado.categorias_nuevas ?? 0}.`;
  else if (cancelada) estado = "Cancelada. Los lotes ya guardados se conservan.";
  else if (empezada) estado = "Pausada. Podés continuar desde el siguiente lote.";

  return (
    <section aria-labelledby="paso-3" className="min-w-0 space-y-4 rounded-2xl border border-borde bg-superficie p-5">
      <h2 id="paso-3" className="text-lg font-bold">
        {terminada ? "Importación terminada" : cancelada ? "Importación cancelada" : "3. Revisá y confirmá"}
      </h2>
      <p className="break-all text-sm font-semibold">{imp.archivo}</p>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(ACCIONES).map(([clave, { etiqueta }]) => (
          <div key={clave} className="rounded-xl bg-fondo p-3">
            <dt className="text-sm text-texto-suave">{etiqueta}</dt>
            <dd className="text-xl font-bold">{cuentas[clave] ?? 0}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm">
        Precios del archivo: <strong>{imp.opciones.tipo_precio === "final" ? "con IVA incluido" : "netos, sin IVA"}</strong>.
      </p>

      <div>
        <label htmlFor="progreso-importacion" className="text-sm font-semibold">
          Lotes guardados: {imp.siguiente_lote} de {imp.total_lotes}
        </label>
        <progress id="progreso-importacion" className="mt-2 h-3 w-full accent-[var(--primario)]" value={imp.siguiente_lote} max={imp.total_lotes} />
      </div>
      <p role="status" className="text-sm">
        {estado}
      </p>

      {!empezada && !terminada && !cancelada && imp.resumen.error > 0 && (
        <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <input type="checkbox" className="mt-1" checked={omitirErrores} onChange={(e) => asistente.setOmitirErrores(e.target.checked)} disabled={ejecutando} />
          Importar solo las filas correctas. Las {imp.resumen.error} filas con errores se omiten y quedan detalladas en el informe.
        </label>
      )}

      <div className="min-w-0 overflow-x-auto rounded-xl border border-borde" tabIndex={0} aria-label="Muestra de la revisión">
        <table className="w-full text-left text-sm">
          <caption className="p-3 text-left text-texto-suave">Muestra de las primeras filas. El informe incluye todas.</caption>
          <thead className="bg-fondo">
            <tr>
              {titulos.map((t) => (
                <th key={t} className="whitespace-nowrap p-2">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {imp.muestra.map((f) => (
              <tr key={f.fila} className="border-t border-borde">
                <td className="p-2">{f.fila}</td>
                <td className="p-2">{f.sku}</td>
                <td className="min-w-40 p-2">
                  {f.producto}
                  {f.presentacion ? ` · ${f.presentacion}` : ""}
                </td>
                <td className="whitespace-nowrap p-2">
                  <Insignia tono={ACCIONES[f.accion].tono}>{ACCIONES[f.accion].etiqueta}</Insignia>
                </td>
                <td className="p-2">{f.precio_anterior != null ? formatearDinero(f.precio_anterior) : "—"}</td>
                <td className="p-2">{f.precio_final != null ? formatearDinero(f.precio_final) : "—"}</td>
                {conStock && <td className="p-2 tabular-nums">{f.stock ?? "—"}</td>}
                <td className="min-w-60 p-2 text-texto-suave">{f.mensaje}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        {ejecutando ? (
          <Boton onClick={asistente.pausar}>Pausar después de este lote</Boton>
        ) : (
          !terminada &&
          !cancelada && (
            <Boton onClick={asistente.ejecutar} disabled={ocupado || faltaAceptarErrores}>
              {empezada ? "Reanudar importación" : "Confirmar e importar"}
            </Boton>
          )
        )}
        <Boton variante="secundario" onClick={asistente.descargarInforme} disabled={ocupado || ejecutando}>
          <Download className="h-4 w-4" aria-hidden="true" /> Descargar informe
        </Boton>
        {!terminada && !cancelada && (
          <Boton variante="secundario" onClick={onCancelar} disabled={ocupado || ejecutando}>
            Cancelar importación
          </Boton>
        )}
        <Boton variante="fantasma" onClick={asistente.volver} disabled={ocupado || ejecutando}>
          {terminada || cancelada ? "Importar otro archivo" : "Volver a las columnas"}
        </Boton>
      </div>
    </section>
  );
}
