import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, Check, AlertTriangle } from "lucide-react";
import { useCarritoDistribuidora } from "../carrito/carrito_context.jsx";
import { precioSinIva, formatearPrecio } from "../utils/precio_iva.js";

// Estados del botón de agregado rápido — el ícono/color/texto reflejan el
// resultado real (antes un error quedaba silenciado: sin catch, sin aviso).
const ESTILO_BOTON = {
  idle:      "bg-(--kt-teal-700) hover:bg-(--kt-petrol)",
  agregando: "bg-(--kt-teal-700)",
  agregado:  "bg-emerald-600",
  error:     "bg-rose-500 kt-shake",
};

export default function ProductoCard({ producto, index }) {
  const { addItem } = useCarritoDistribuidora();
  const [estado, setEstado] = useState("idle"); // idle | agregando | agregado | error
  const timeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const variedades = producto.variedades ?? [];
  const variedadMin = variedades.length
    ? variedades.reduce((min, v) => (Number(v.precio) < Number(min.precio) ? v : min))
    : null;

  const unaSolaVariedad = variedades.length === 1;
  const sinStock = unaSolaVariedad && variedades[0].controla_stock && variedades[0].cantidad <= 0;

  async function agregarRapido() {
    if (!unaSolaVariedad || estado === "agregando") return;
    setEstado("agregando");
    let falló = false;
    try {
      await addItem({ producto_id: producto.id, variedad_id: variedades[0].id, cantidad: 1 });
      setEstado("agregado");
    } catch {
      falló = true;
      setEstado("error");
    } finally {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setEstado("idle"), falló ? 1600 : 1100);
    }
  }

  const IconoBoton = estado === "agregado" ? Check : estado === "error" ? AlertTriangle : ShoppingBag;
  const textoBoton = sinStock
    ? "Sin stock"
    : { idle: "Agregar", agregando: "Agregando…", agregado: "¡Listo!", error: "No se pudo" }[estado];

  return (
    <div
      style={{ animationDelay: `${Math.min((index ?? 0) * 30, 300)}ms` }}
      className="kt-item-in kt-card group flex flex-col overflow-hidden rounded-2xl border border-(--kt-border) bg-white shadow-sm"
    >
      <Link to={`/distribuidora/catalogo/${producto.id}`} className="kt-img-card relative block aspect-square overflow-hidden bg-(--kt-bg-soft)">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url} alt={producto.nombre}
            loading="lazy" decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="rounded-full bg-white/70 p-4 text-(--kt-ink-soft) shadow-sm"><Package size={28} /></div>
          </div>
        )}
        {sinStock && (
          <span className="absolute left-2 top-2 rounded-full border border-(--kt-border) bg-white/95 px-2 py-0.5 text-[10px] font-bold text-(--kt-ink-soft)">
            Sin stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        {producto.marca && <p className="text-[11px] font-semibold uppercase tracking-wide text-(--kt-ink-soft)">{producto.marca}</p>}
        <Link to={`/distribuidora/catalogo/${producto.id}`} className="mt-0.5 line-clamp-2 text-sm font-bold text-(--kt-ink) hover:text-(--kt-teal-700)">
          {producto.nombre}
        </Link>

        {/* Precio y acción SIEMPRE apilados (no lado a lado) — con la grilla en
            2 columnas en mobile la card queda angosta y "Desde $ X,XX" + un
            botón en la misma fila se pisaban entre sí. */}
        <div className="mt-auto space-y-2 pt-3">
          <div className="min-w-0">
            {variedadMin ? (
              <>
                <p className="font-extrabold text-(--kt-ink)">
                  {variedades.length > 1 ? "Desde " : ""}{formatearPrecio(variedadMin.precio)}
                </p>
                <p className="truncate text-[11px] text-(--kt-ink-soft)">
                  Sin IVA: {formatearPrecio(precioSinIva(variedadMin.precio, variedadMin.iva_porcentaje))}
                </p>
              </>
            ) : (
              <p className="text-xs text-(--kt-ink-soft)">Sin variedades</p>
            )}
          </div>

          {unaSolaVariedad ? (
            <button
              type="button" onClick={agregarRapido} disabled={estado === "agregando" || sinStock}
              className={`inline-flex w-full items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60 ${
                sinStock ? "bg-slate-300" : ESTILO_BOTON[estado]
              }`}
            >
              <IconoBoton key={estado} size={13} className={estado === "agregado" || estado === "error" ? "kt-pop" : ""} />
              {textoBoton}
            </button>
          ) : (
            <Link to={`/distribuidora/catalogo/${producto.id}`}
              className="block w-full rounded-xl border border-(--kt-border) px-2.5 py-1.5 text-center text-xs font-semibold text-(--kt-ink-soft) transition hover:border-(--kt-turquoise) hover:text-(--kt-teal-700)">
              Ver opciones
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
