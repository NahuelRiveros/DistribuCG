import Insignia from "@/componentes/ui/insignia.jsx";
import Tabla from "@/componentes/ui/tabla.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { ESTADOS_COBRO, estadoPedido, etiquetaMetodo, etiquetaModalidad, fechaHora, nombrePersona } from "../utils/presentacion.js";
import Totales from "./totales.jsx";

/** Encabezado con estado y cobro (cliente y panel). */
export function EstadoPedido({ pedido }) {
  const estado = estadoPedido(pedido.estado);
  const cobro = ESTADOS_COBRO[pedido.estado_cobro];
  return (
    <div className="flex flex-wrap gap-2">
      <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
      <Insignia tono={cobro.tono}>{cobro.etiqueta}</Insignia>
    </div>
  );
}

export function ItemsPedido({ pedido }) {
  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5" aria-labelledby="titulo-items">
      <h2 id="titulo-items" className="mb-3 text-lg font-bold">
        Productos
      </h2>
      {/* Lo ven el cliente (sin menú lateral: tarjetas solo en celular) y el panel */}
      <Tabla
        etiqueta="Productos del pedido"
        filas={pedido.items}
        compacta
        tarjetasHasta="md"
        columnas={[
          {
            titulo: "Producto",
            principal: true,
            celda: (i) => (
              <>
                {i.nombre_producto}
                {i.presentacion && <span className="text-texto-suave"> · {i.presentacion}</span>}
                {i.sku && <span className="block text-xs text-texto-suave">{i.sku}</span>}
              </>
            ),
          },
          { titulo: "Cantidad", derecha: true, celda: (i) => i.cantidad },
          { titulo: "Precio", derecha: true, celda: (i) => formatearDinero(i.precio_final_unitario) },
          { titulo: "Subtotal", derecha: true, className: "font-semibold", celda: (i) => formatearDinero(i.subtotal_final) },
        ]}
      />
      <div className="ml-auto mt-4 max-w-xs">
        <Totales
          subtotal_neto={pedido.subtotal_neto}
          iva={pedido.total_iva}
          descuento={pedido.descuento}
          // Los pedidos anteriores a los medios de pago no tienen medio (ni descuento)
          etiquetaDescuento={pedido.medio_pago ? `Descuento por ${etiquetaMetodo(pedido.medio_pago).toLowerCase()}` : undefined}
          total={pedido.total}
        />
        {pedido.medio_pago && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-texto-suave">Medio de pago elegido</span>
            <span>{etiquetaMetodo(pedido.medio_pago)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-texto-suave">Cobrado</span>
          <span className="tabular-nums">{formatearDinero(pedido.monto_cobrado)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>Saldo</span>
          <span className="tabular-nums" data-testid="saldo">
            {formatearDinero(pedido.saldo)}
          </span>
        </div>
      </div>
    </section>
  );
}

export function EntregaPedido({ pedido }) {
  const e = pedido.entrega;
  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5 text-sm" aria-labelledby="titulo-entrega">
      <h2 id="titulo-entrega" className="mb-2 text-lg font-bold">
        Entrega
      </h2>
      <p className="font-semibold">{etiquetaModalidad(pedido.modalidad_entrega)}</p>
      <address className="mt-1 not-italic text-texto-suave">
        {[e.nombre, e.apellido].filter(Boolean).join(" ")} · {e.email}
        <br />
        {e.direccion}, {e.localidad}, {e.provincia} {e.codigo_postal ?? ""}
        <br />
        Tel. {e.telefono}
        {e.indicaciones && (
          <>
            <br />
            {e.indicaciones}
          </>
        )}
        {(e.razon_social || e.cuit) && (
          <>
            <br />
            Factura: {[e.razon_social, e.cuit && `CUIT ${e.cuit}`].filter(Boolean).join(" · ")}
          </>
        )}
      </address>
      {pedido.notas && <p className="mt-2 rounded-lg bg-fondo p-2">Notas: {pedido.notas}</p>}
    </section>
  );
}

export function HistorialPedido({ pedido, mostrarUsuario = false }) {
  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5" aria-labelledby="titulo-historial">
      <h2 id="titulo-historial" className="mb-3 text-lg font-bold">
        Historial
      </h2>
      <ol className="space-y-3 border-l-2 border-borde pl-4 text-sm">
        {pedido.historial.map((h) => (
          <li key={h.id}>
            <p className="font-semibold">{estadoPedido(h.estado_nuevo).etiqueta}</p>
            <p className="text-texto-suave">
              {fechaHora(h.creado_en)}
              {mostrarUsuario && ` · ${nombrePersona(h.usuario)}`}
            </p>
            {h.motivo && <p className="text-texto-suave">{h.motivo}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
