import { useConsultaMedia } from "@/hooks/use_consulta_media.js";
import { cn } from "@/utils/cn.js";

// Hasta qué ancho se muestran tarjetas en vez de tabla. En el panel el menú lateral ocupa
// 256 px desde 768 px, así que la tabla recién entra cómoda desde 1024 px ("lg").
const CORTES = { md: "(max-width: 767px)", lg: "(max-width: 1023px)" };

/**
 * Lista de datos que en pantallas anchas es una tabla y en celular una tarjeta por fila.
 *
 * columnas: [{
 *   titulo,                  // encabezado (y rótulo en la tarjeta)
 *   celda: (fila) => JSX,    // contenido
 *   principal: true,         // en la tarjeta va arriba, sin rótulo (ej. nombre del producto)
 *   derecha: true,           // alineado a la derecha (números)
 *   enTarjeta: false,        // no mostrarla en la tarjeta (dato secundario)
 *   className,               // clases extra de la celda en la tabla
 * }]
 * acciones: (fila, { enTarjeta }) => JSX   // botones: última columna / pie de la tarjeta (en la tarjeta pueden llevar texto)
 */
export default function Tabla({ etiqueta, filas, clave = (f) => f.id, columnas, acciones, tarjetasHasta = "lg", compacta = false }) {
  const enTarjetas = useConsultaMedia(CORTES[tarjetasHasta]);

  if (enTarjetas) {
    const principales = columnas.filter((c) => c.principal);
    const resto = columnas.filter((c) => !c.principal && c.enTarjeta !== false);
    return (
      <ul aria-label={etiqueta} className={cn("space-y-3", compacta && "space-y-2")}>
        {filas.map((fila) => (
          <li key={clave(fila)} className={cn("rounded-2xl border border-borde bg-superficie p-4", compacta && "rounded-xl p-3")}>
            {principales.map((c) => (
              <div key={c.titulo}>{c.celda(fila)}</div>
            ))}
            {resto.length > 0 && (
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {resto.map((c) => (
                  <div key={c.titulo} className="min-w-0">
                    <dt className="text-xs text-texto-suave">{c.titulo}</dt>
                    <dd className="tabular-nums">{c.celda(fila)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {acciones && <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-borde pt-2">{acciones(fila, { enTarjeta: true })}</div>}
          </li>
        ))}
      </ul>
    );
  }

  const celda = compacta ? "py-2 pr-4 last:pr-0" : "px-4 py-3";
  return (
    <div className={cn("overflow-x-auto", !compacta && "rounded-2xl border border-borde bg-superficie")}>
      <table className="w-full text-left text-sm" aria-label={etiqueta}>
        <thead className={cn("text-xs uppercase tracking-wide text-texto-suave", !compacta && "border-b border-borde bg-fondo")}>
          <tr>
            {columnas.map((c) => (
              <th key={c.titulo} className={cn(celda, c.derecha && "text-right")}>
                {c.titulo}
              </th>
            ))}
            {acciones && <th className={cn(celda, "text-right")}>Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {filas.map((fila) => (
            <tr key={clave(fila)} className={cn(!compacta && "hover:bg-fondo/60")}>
              {columnas.map((c) => (
                <td key={c.titulo} className={cn(celda, c.derecha && "text-right tabular-nums", c.className)}>
                  {c.celda(fila)}
                </td>
              ))}
              {acciones && (
                <td className={celda}>
                  <div className="flex justify-end gap-1">{acciones(fila, { enTarjeta: false })}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
