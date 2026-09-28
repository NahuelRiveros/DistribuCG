import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { linkConRetorno } from "@/componentes/acceso/volver_a.js";
import { ImagenProducto } from "@/modulos/catalogo/tienda/producto_card.jsx";
import { useCarrito } from "../hooks/use_carrito.js";
import SelectorCantidad from "../componentes/selector_cantidad.jsx";
import Totales from "../componentes/totales.jsx";
import { ANCHOS } from "@/utils/imagenes.js";
import { verProductos } from "@/clientes/index.js";

const CONFIRMAR = "/pedido/confirmar";

export default function CarritoPage() {
  const { carrito, cargando, error, recargar, conCuenta, cambiarCantidad, quitar, ocupado } = useCarrito();
  const toast = useToast();
  const navigate = useNavigate();

  const accion = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      toast.error(mensajeDeError(e));
    }
  };

  let contenido;
  if (cargando) contenido = <Cargando texto="Cargando tu pedido..." />;
  else if (error) contenido = <ErrorCarga error={error} onReintentar={recargar} />;
  else if (carrito.items.length === 0) {
    contenido = <Vacio titulo="Tu pedido está vacío" texto="Buscá lo que necesitás y agregalo acá." accion={<Boton a="/catalogo">{verProductos}</Boton>} />;
  } else {
    const faltaMinimo = carrito.pedido_minimo != null && carrito.totales.total < carrito.pedido_minimo;
    contenido = (
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-borde rounded-2xl border border-borde bg-superficie" aria-label="Productos del pedido">
          {carrito.items.map((l) => (
            <li key={l.item_id ?? l.variante_id} className="flex flex-wrap gap-4 p-4 sm:flex-nowrap">
              <ImagenProducto imagen={l.imagen ? { url: l.imagen } : null} nombre={l.producto ?? ""} ancho={ANCHOS.miniatura} className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                {l.slug ? (
                  <Link to={`/catalogo/${l.slug}`} className="font-semibold hover:text-primario">
                    {l.producto}
                  </Link>
                ) : (
                  <p className="font-semibold">Producto no disponible</p>
                )}
                {l.presentacion && <p className="text-sm text-texto-suave">{l.presentacion}</p>}
                {l.precio_final_unitario != null && <p className="text-sm text-texto-suave">{formatearDinero(l.precio_final_unitario)} c/u</p>}
                {l.precio_cambio && <p className="mt-1 text-xs text-amber-700">El precio cambió desde que lo agregaste.</p>}
                {l.mensaje && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-peligro" role="alert">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {l.mensaje}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <SelectorCantidad valor={l.cantidad} onCambiar={accion((n) => cambiarCantidad(l, n))} deshabilitado={ocupado} etiqueta={`Cantidad de ${l.producto ?? "producto"}`} />
                <p className="w-24 text-right font-semibold tabular-nums">{l.subtotal_final != null ? formatearDinero(l.subtotal_final) : "—"}</p>
                <Boton variante="fantasma" tamano="icono" onClick={accion(() => quitar(l))} aria-label={`Quitar ${l.producto ?? "producto"}`}>
                  <Trash2 className="h-4 w-4 text-peligro" />
                </Boton>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-2xl border border-borde bg-superficie p-5" aria-label="Resumen">
          <Totales {...carrito.totales} />
          {faltaMinimo && <p className="text-sm text-peligro">El pedido mínimo es de {formatearDinero(carrito.pedido_minimo)}.</p>}
          {!carrito.se_puede_enviar && !faltaMinimo && <p className="text-sm text-peligro">Resolvé los productos marcados para continuar.</p>}
          <Boton className="w-full justify-center" disabled={!carrito.se_puede_enviar} onClick={() => navigate(conCuenta ? CONFIRMAR : linkConRetorno("/login", CONFIRMAR))}>
            Continuar
          </Boton>
          {!conCuenta && <p className="text-center text-xs text-texto-suave">Para enviar el pedido vas a ingresar o crear tu cuenta. Lo que armaste no se pierde.</p>}
        </aside>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 font-titulos text-3xl font-bold">Mi pedido</h1>
      {contenido}
    </div>
  );
}
