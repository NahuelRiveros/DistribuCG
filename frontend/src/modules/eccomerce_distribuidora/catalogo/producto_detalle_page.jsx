import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, Package, ChevronRight, Minus, Plus, Check, AlertTriangle } from "lucide-react";
import { getProducto } from "../api/producto_distribuidora_api.js";
import { useCarritoDistribuidora } from "../carrito/carrito_context.jsx";
import { precioSinIva, formatearPrecio } from "../utils/precio_iva.js";

// Estilos por resultado del click en "Agregar al pedido" — antes el mensaje
// de error usaba el mismo verde que el de éxito (bug real, no solo estético).
const ESTILO_BOTON = {
  idle:      "bg-blue-600 hover:bg-blue-500",
  agregando: "bg-blue-600",
  ok:        "bg-emerald-600",
  error:     "bg-rose-600 kt-shake",
};

export default function ProductoDetalleDistribuidoraPage() {
  const { id } = useParams();
  const { addItem } = useCarritoDistribuidora();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [variedadId, setVariedadId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState("idle"); // idle | agregando | ok | error
  const [errorTexto, setErrorTexto] = useState("");
  const timeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  useEffect(() => {
    setCargando(true);
    getProducto(id)
      .then((p) => { setProducto(p); setVariedadId(p.variedades?.[0]?.id ?? null); })
      .catch(() => setProducto(null))
      .finally(() => setCargando(false));
  }, [id]);

  // Si cambiás de variedad y la cantidad elegida ya no entra en el stock de
  // la nueva, la reacomodamos — mismo tope que usa el stepper del carrito.
  useEffect(() => {
    const v = producto?.variedades?.find((x) => x.id === variedadId) ?? null;
    if (v?.controla_stock && cantidad > v.cantidad) {
      setCantidad(Math.max(1, v.cantidad));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variedadId]);

  if (cargando) {
    return <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-400">Cargando…</div>;
  }
  if (!producto) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">Producto no encontrado.</p>
        <Link to="/distribuidora/catalogo" className="mt-2 inline-block text-sm font-semibold text-blue-600">Volver al catálogo</Link>
      </div>
    );
  }

  const variedad = producto.variedades?.find((v) => v.id === variedadId) ?? null;
  // Si la variedad no controla stock acá, siempre se puede pedir — la
  // disponibilidad real se confirma al procesar la nota de pedido.
  const sinStock = variedad?.controla_stock && variedad.cantidad <= 0;
  const maxCantidad = variedad?.controla_stock ? variedad.cantidad : 99;

  async function agregar() {
    if (!variedad || estado === "agregando") return;
    setEstado("agregando");
    try {
      await addItem({ producto_id: producto.id, variedad_id: variedad.id, cantidad });
      setEstado("ok");
    } catch (e) {
      setErrorTexto(e?.response?.data?.mensaje || "No se pudo agregar, probá de nuevo");
      setEstado("error");
    } finally {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setEstado("idle"), 2200);
    }
  }

  const IconoBoton = estado === "ok" ? Check : estado === "error" ? AlertTriangle : ShoppingBag;
  const textoBoton = { idle: "Agregar al pedido", agregando: "Agregando…", ok: "¡Agregado!", error: "No se pudo" }[estado];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Link to="/distribuidora/catalogo" className="hover:text-blue-600">Catálogo</Link>
          {producto.categoria?.nombre && (
            <>
              <ChevronRight size={13} className="text-slate-300" />
              <Link to={`/distribuidora/catalogo?categoria=${producto.categoria.id}`} className="hover:text-blue-600">
                {producto.categoria.nombre}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="text-slate-300" />
          <span className="truncate text-slate-400">{producto.nombre}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7">
          <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
            {producto.imagen_url ? (
              <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="rounded-full bg-white/70 p-6 text-slate-300 shadow-sm"><Package size={40} /></div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {producto.marca && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{producto.marca}</p>}
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">{producto.nombre}</h1>
            {producto.descripcion && <p className="mt-3 text-sm leading-6 text-slate-600">{producto.descripcion}</p>}

            {!producto.variedades?.length ? (
              <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Este producto todavía no tiene variedades cargadas.
              </p>
            ) : (
              <>
                {producto.variedades.length > 1 && (
                  <div className="mt-5">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Elegí una opción</p>
                    <div className="flex flex-wrap gap-2">
                      {producto.variedades.map((v) => (
                        <button
                          key={v.id} type="button" onClick={() => setVariedadId(v.id)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            variedadId === v.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:border-blue-300"
                          }`}
                        >
                          <span className="block font-semibold">{v.nombre ?? "Única"}</span>
                          <span className="block text-xs">{formatearPrecio(v.precio)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {variedad ? formatearPrecio(variedad.precio) : "—"}
                    </p>
                    {variedad && (
                      <p className="text-xs text-slate-400">
                        Precio sin IVA: {formatearPrecio(precioSinIva(variedad.precio, variedad.iva_porcentaje))}
                      </p>
                    )}
                    {variedad?.controla_stock && (
                      <p className="text-xs text-slate-400">{sinStock ? "Sin stock" : `${variedad.cantidad} disponibles`}</p>
                    )}
                    {variedad?.cod_ref && (
                      <p className="mt-1 text-[11px] text-slate-300">Código: {variedad.cod_ref}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 px-1 py-1">
                      <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        className="rounded-lg p-1.5 text-slate-500 transition active:scale-90 hover:bg-slate-100 hover:text-slate-800"><Minus size={14} /></button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                      <button type="button" onClick={() => setCantidad((c) => Math.min(c + 1, maxCantidad))}
                        className="rounded-lg p-1.5 text-slate-500 transition active:scale-90 hover:bg-slate-100 hover:text-slate-800"><Plus size={14} /></button>
                    </div>
                    <button
                      type="button" onClick={agregar} disabled={estado === "agregando" || sinStock || !variedad}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60 ${ESTILO_BOTON[estado]}`}
                    >
                      <IconoBoton key={estado} size={15} className={estado === "ok" || estado === "error" ? "kt-pop" : ""} />
                      {textoBoton}
                    </button>
                  </div>
                </div>
                {estado === "error" && (
                  <p className="kt-item-in mt-2 text-right text-xs font-semibold text-rose-600">{errorTexto}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
