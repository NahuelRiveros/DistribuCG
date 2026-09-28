import { useState } from "react";
import { Link } from "react-router-dom";
import Boton from "@/componentes/ui/boton.jsx";
import Paginacion from "@/componentes/ui/paginacion.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { useMisPedidos } from "../hooks/use_tienda.js";
import { EstadoPedido } from "../componentes/detalle_pedido.jsx";
import { fechaHora, numeroPedido } from "../utils/presentacion.js";
import { verProductos } from "@/clientes/index.js";

export default function MisPedidosPage() {
  const [pagina, setPagina] = useState(1);
  const pedidos = useMisPedidos({ pagina });

  let contenido;
  if (pedidos.isPending) contenido = <Cargando />;
  else if (pedidos.isError) contenido = <ErrorCarga error={pedidos.error} onReintentar={pedidos.refetch} />;
  else if (pedidos.data.pedidos.length === 0) contenido = <Vacio titulo="Todavía no hiciste pedidos" accion={<Boton a="/catalogo">{verProductos}</Boton>} />;
  else {
    contenido = (
      <>
        <ul className="space-y-3">
          {pedidos.data.pedidos.map((p) => (
            <li key={p.id}>
              <Link to={`/mis-pedidos/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borde bg-superficie p-4 hover:border-primario">
                <div>
                  <p className="font-semibold">Pedido {numeroPedido(p.id)}</p>
                  <p className="text-sm text-texto-suave">
                    {fechaHora(p.creado_en)} · {p.cantidad_items} producto(s)
                  </p>
                </div>
                <EstadoPedido pedido={p} />
                <p className="text-lg font-bold tabular-nums">{formatearDinero(p.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
        <Paginacion paginacion={pedidos.data.paginacion} onCambiar={setPagina} deshabilitado={pedidos.isFetching} />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 font-titulos text-3xl font-bold">Mis pedidos</h1>
      {contenido}
    </div>
  );
}
