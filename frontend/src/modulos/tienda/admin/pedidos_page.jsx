import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { proyecto } from "compartido/proyecto.js";
import Paginacion from "@/componentes/ui/paginacion.jsx";
import Tabla from "@/componentes/ui/tabla.jsx";
import SearchField from "@/componentes/ui/search_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { usePedidosPanel } from "../hooks/use_tienda.js";
import { EstadoPedido } from "../componentes/detalle_pedido.jsx";
import { ESTADOS_COBRO, fechaHora, numeroPedido } from "../utils/presentacion.js";

const ESTADOS = Object.entries(proyecto.pedidos.estados).map(([valor, { etiqueta }]) => ({ valor, etiqueta }));
const COBROS = Object.entries(ESTADOS_COBRO).map(([valor, { etiqueta }]) => ({ valor, etiqueta }));

export default function PedidosPage() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    q: params.get("q") ?? "",
    estado: params.get("estado") ?? "",
    estado_cobro: params.get("estado_cobro") ?? "",
    pagina: Number(params.get("pagina") ?? 1),
  };
  const pedidos = usePedidosPanel(filtros);

  const actualizar = useCallback(
    (clave, valor) =>
      setParams((actuales) => {
        const nuevos = new URLSearchParams(actuales);
        if (valor) nuevos.set(clave, valor);
        else nuevos.delete(clave);
        if (clave !== "pagina") nuevos.delete("pagina");
        return nuevos;
      }),
    [setParams],
  );
  const buscar = useCallback((texto) => actualizar("q", texto), [actualizar]);

  return (
    <div>
      <h1 className="font-titulos text-2xl font-bold">Pedidos</h1>
      <p className="text-sm text-texto-suave">Los pedidos que envían los clientes desde la tienda.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <SearchField valor={filtros.q} onBuscar={buscar} etiqueta="Buscar pedidos" placeholder="Número (#12), nombre o email del cliente" />
        <SelectField name="estado" aria-label="Filtrar por estado" opciones={ESTADOS} placeholder="Todos los estados" value={filtros.estado} onChange={(e) => actualizar("estado", e.target.value)} className="mt-0" />
        <SelectField name="estado_cobro" aria-label="Filtrar por cobro" opciones={COBROS} placeholder="Todos los cobros" value={filtros.estado_cobro} onChange={(e) => actualizar("estado_cobro", e.target.value)} className="mt-0" />
      </div>

      <div className="mt-6">
        {pedidos.isPending ? (
          <Cargando texto="Cargando pedidos..." />
        ) : pedidos.isError ? (
          <ErrorCarga error={pedidos.error} onReintentar={pedidos.refetch} />
        ) : pedidos.data.pedidos.length === 0 ? (
          <Vacio titulo="No hay pedidos para mostrar" texto={filtros.q || filtros.estado || filtros.estado_cobro ? "Probá con otros filtros." : "Cuando un cliente envíe un pedido, aparece acá."} />
        ) : (
          <>
            <Tabla
              etiqueta="Pedidos"
              filas={pedidos.data.pedidos}
              columnas={[
                {
                  titulo: "Pedido",
                  principal: true,
                  celda: (p) => (
                    <>
                      <Link to={`/admin/pedidos/${p.id}`} className="font-semibold text-primario hover:underline">
                        {numeroPedido(p.id)}
                      </Link>
                      <p className="text-xs text-texto-suave">{fechaHora(p.creado_en)}</p>
                    </>
                  ),
                },
                {
                  titulo: "Cliente",
                  principal: true,
                  celda: (p) => (
                    <>
                      <p>{[p.entrega.nombre, p.entrega.apellido].filter(Boolean).join(" ")}</p>
                      <p className="text-xs text-texto-suave">
                        {p.entrega.localidad} · {p.entrega.telefono}
                      </p>
                    </>
                  ),
                },
                { titulo: "Productos", derecha: true, celda: (p) => p.cantidad_items },
                { titulo: "Total", derecha: true, className: "font-semibold", celda: (p) => formatearDinero(p.total) },
                { titulo: "Estado", celda: (p) => <EstadoPedido pedido={p} /> },
              ]}
            />
            <Paginacion paginacion={pedidos.data.paginacion} onCambiar={(p) => actualizar("pagina", String(p))} deshabilitado={pedidos.isFetching} />
          </>
        )}
      </div>
    </div>
  );
}
