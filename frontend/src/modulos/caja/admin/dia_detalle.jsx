import { Link } from "react-router-dom";
import { Ban, Pencil, Plus, Store } from "lucide-react";
import { fechaLarga } from "compartido/reglas/fechas.js";
import Boton from "@/componentes/ui/boton.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { cn } from "@/utils/cn.js";
import { useMovimientosCaja } from "../hooks/use_caja.js";
import { etiquetaMedio, montoConSigno, TIPOS } from "../utils/presentacion.js";

/** Movimientos de un día. Los cobros de pedidos se ven, pero se gestionan desde el pedido. */
export default function DiaDetalle({ fecha, esFuturo, onRegistrar, onEditar, onAnular }) {
  const movimientos = useMovimientosCaja({ desde: fecha, hasta: fecha, limite: 100 });

  return (
    <section aria-labelledby="dia-elegido" className="rounded-2xl border border-borde bg-superficie p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dia-elegido" className="text-lg font-bold">
          {fechaLarga(fecha)}
        </h2>
        {!esFuturo && (
          <Boton tamano="chico" onClick={() => onRegistrar(fecha)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Registrar
          </Boton>
        )}
      </div>

      <div className="mt-3">
        {movimientos.isPending ? (
          <Cargando texto="Cargando movimientos..." />
        ) : movimientos.isError ? (
          <ErrorCarga error={movimientos.error} onReintentar={movimientos.refetch} />
        ) : movimientos.data.movimientos.length === 0 ? (
          <p className="py-4 text-sm text-texto-suave">{esFuturo ? "Este día todavía no llegó." : "No hay movimientos este día."}</p>
        ) : (
          <ul className="divide-y divide-borde" aria-label={`Movimientos del ${fechaLarga(fecha)}`}>
            {movimientos.data.movimientos.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TIPOS[m.tipo].serie, m.anulado && "opacity-40")} aria-hidden="true" />
                <div className={cn("min-w-0 flex-1", m.anulado && "text-texto-suave")}>
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className={cn(m.anulado && "line-through")}>{m.categoria}</span>
                    {m.origen === "tienda" && (
                      <Insignia tono="info">
                        <Store className="mr-1 h-3 w-3" aria-hidden="true" /> Tienda
                      </Insignia>
                    )}
                    {m.anulado && <Insignia tono="peligro">Anulado</Insignia>}
                  </p>
                  <p className="text-xs text-texto-suave">
                    {[m.descripcion, etiquetaMedio(m.medio), `cargó ${m.registrado_por}`].filter(Boolean).join(" · ")}
                  </p>
                  {m.anulado && <p className="text-xs text-texto-suave">Motivo: {m.motivo_anulacion}</p>}
                </div>
                <span className={cn("font-semibold tabular-nums", m.anulado && "text-texto-suave line-through")}>{montoConSigno(m.tipo, m.monto)}</span>
                {m.origen === "manual" && !m.anulado && (
                  <span className="flex gap-1">
                    <Boton variante="fantasma" tamano="icono" onClick={() => onEditar(m)} aria-label={`Editar ${m.categoria} ${montoConSigno(m.tipo, m.monto)}`} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Boton>
                    <Boton variante="fantasma" tamano="icono" onClick={() => onAnular(m)} aria-label={`Anular ${m.categoria} ${montoConSigno(m.tipo, m.monto)}`} title="Anular" className="text-peligro">
                      <Ban className="h-4 w-4" />
                    </Boton>
                  </span>
                )}
                {m.origen === "tienda" && (
                  <Link to={`/admin/pedidos/${m.pedido_id}`} className="text-sm font-medium text-primario hover:underline">
                    Ver pedido
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
