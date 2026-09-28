import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Insignia from "@/componentes/ui/insignia.jsx";
import Paginacion from "@/componentes/ui/paginacion.jsx";
import Tabla from "@/componentes/ui/tabla.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { useHistorialStock } from "../hooks/use_stock.js";
import { ESTADOS_STOCK, TIPOS_MOVIMIENTO, conSigno, nombreExistencia } from "../utils/presentacion.js";

function Dato({ etiqueta, valor }) {
  return (
    <div className="rounded-xl bg-fondo p-3">
      <dt className="text-xs text-texto-suave">{etiqueta}</dt>
      <dd className="text-xl font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

const detalleMovimiento = (m) =>
  [m.motivo, m.referencia_id && `${m.referencia_tipo ?? "Ref."} ${m.referencia_id}`, m.costo_unitario && `costo ${formatearDinero(m.costo_unitario)}`]
    .filter(Boolean)
    .join(" · ") || "—";

/** Historial (kardex) de una presentación: cada entrada y salida con su saldo. */
export default function HistorialPage() {
  const { id } = useParams();
  const [pagina, setPagina] = useState(1);
  const historial = useHistorialStock(id, { pagina });

  if (historial.isPending) return <Cargando />;
  if (historial.isError) return <ErrorCarga error={historial.error} onReintentar={historial.refetch} />;
  const { existencia, movimientos, paginacion } = historial.data;
  const estado = ESTADOS_STOCK[existencia.estado];

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/stock" className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-texto">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Existencias
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-titulos text-2xl font-bold">{nombreExistencia(existencia)}</h1>
        <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
      </div>
      {existencia.sku && <p className="text-sm text-texto-suave">Código {existencia.sku}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato etiqueta="Cantidad" valor={existencia.cantidad} />
        <Dato etiqueta="Reservado" valor={existencia.reservado} />
        <Dato etiqueta="Disponible" valor={existencia.disponible} />
        <Dato etiqueta="Mínimo" valor={existencia.minimo} />
      </dl>

      <h2 className="mb-3 mt-8 text-lg font-bold">Movimientos</h2>
      {movimientos.length === 0 ? (
        <Vacio titulo="Todavía no hay movimientos" texto="Aparecen al registrar un ingreso, un ajuste o una venta." />
      ) : (
        <>
          <Tabla
            etiqueta="Movimientos de stock"
            filas={movimientos}
            columnas={[
              {
                titulo: "Fecha",
                principal: true,
                className: "whitespace-nowrap",
                celda: (m) => new Date(m.creado_en).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }),
              },
              {
                titulo: "Tipo",
                principal: true,
                celda: (m) => <Insignia tono={TIPOS_MOVIMIENTO[m.tipo].tono}>{TIPOS_MOVIMIENTO[m.tipo].etiqueta}</Insignia>,
              },
              {
                titulo: "Cambio",
                derecha: true,
                className: "font-semibold",
                celda: (m) => (
                  <>
                    {m.cantidad !== 0 && conSigno(m.cantidad)}
                    {m.reservado !== 0 && <span className="block text-xs font-normal text-texto-suave">reservado {conSigno(m.reservado)}</span>}
                  </>
                ),
              },
              { titulo: "Saldo", derecha: true, celda: (m) => m.saldo_cantidad },
              { titulo: "Detalle", className: "text-texto-suave", celda: detalleMovimiento },
              { titulo: "Usuario", celda: (m) => (m.usuario ? [m.usuario.nombre, m.usuario.apellido].filter(Boolean).join(" ") : "Sistema") },
            ]}
          />
          <Paginacion paginacion={paginacion} onCambiar={setPagina} deshabilitado={historial.isFetching} />
        </>
      )}
    </div>
  );
}
