import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { cn } from "@/utils/cn.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { useProducto } from "../hooks/use_catalogo.js";
import { leyendaIva, precioVisible, presentacionMasBarata } from "../utils/precios.js";
import { ImagenProducto } from "./producto_card.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import { sinStock, textoDisponibilidad } from "../utils/disponibilidad.js";
import { modulosActivos } from "@/modulos/registro.js";
import MediosPagoSeccion from "@/componentes/pagos/medios_pago_seccion.jsx";
import ResumenPago, { CintaPago } from "@/componentes/pagos/resumen_pago.jsx";
import { usePagos } from "@/hooks/use_pagos.js";
import { nombreProductos } from "@/clientes/index.js";

// Acciones que otros módulos agregan al detalle (ej. la tienda: "Agregar al pedido").
const ACCIONES = modulosActivos.flatMap((m) => m.accionesProducto ?? []);

const { etiqueta_variante } = proyecto.catalogo;

function Galeria({ imagenes, nombre }) {
  const [actual, setActual] = useState(0);
  return (
    <div>
      <ImagenProducto imagen={imagenes[actual]} nombre={nombre} className="aspect-square w-full rounded-2xl border border-borde" />
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2", i === actual ? "border-primario" : "border-transparent")}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Detalle({ producto }) {
  const [elegidaId, setElegidaId] = useState(() => presentacionMasBarata(producto)?.id);
  const elegida = producto.variantes.find((v) => v.id === elegidaId) ?? producto.variantes[0];
  const varias = producto.variantes.length > 1;
  const precio = precioVisible(elegida.precio, elegida.iva_porcentaje);
  // Si la config de pagos todavía no llegó (o falló), la ficha se ve igual, sin esa parte.
  const { data: pagos } = usePagos();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Galeria imagenes={producto.imagenes} nombre={producto.nombre} />
      <div>
        {producto.marca && <p className="text-sm font-semibold uppercase tracking-wide text-texto-suave">{producto.marca}</p>}
        <h1 className="mt-1 font-titulos text-3xl font-bold">{producto.nombre}</h1>
        <div className="mt-3">
          {pagos && <CintaPago pagos={pagos} />}
        </div>

        {varias && (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">{etiqueta_variante}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {producto.variantes.map((v) => (
                <label
                  key={v.id}
                  className={cn(
                    "cursor-pointer rounded-xl border px-4 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primario",
                    v.id === elegida.id ? "border-primario bg-primario/10 font-semibold text-primario" : "border-borde hover:border-texto-suave",
                    sinStock(v) && "text-texto-suave line-through decoration-1",
                  )}
                >
                  <input type="radio" name="presentacion" value={v.id} checked={v.id === elegida.id} onChange={() => setElegidaId(v.id)} className="sr-only" />
                  {v.nombre || "Única"}
                  {sinStock(v) && <span className="sr-only"> (sin stock)</span>}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6" aria-live="polite">
          {elegida.precio_anterior && (
            <p className="text-texto-suave line-through">{formatearDinero(precioVisible(elegida.precio_anterior, elegida.iva_porcentaje))}</p>
          )}
          <p className="text-3xl font-bold" data-testid="precio">
            {formatearDinero(precio)}
          </p>
          <p className="text-sm text-texto-suave">{leyendaIva}</p>
          {pagos && <ResumenPago precio={precio} pagos={pagos} />}
          <p className="mt-3">
            <Insignia tono={textoDisponibilidad(elegida).tono}>{textoDisponibilidad(elegida).etiqueta}</Insignia>
          </p>
          {elegida.sku && <p className="mt-2 text-xs text-texto-suave">Código: {elegida.sku}</p>}
        </div>

        {ACCIONES.map((Accion, i) => (
          <Accion key={`${i}-${elegida.id}`} producto={producto} variante={elegida} />
        ))}

        {producto.descripcion && <p className="mt-6 whitespace-pre-line text-texto-suave">{producto.descripcion}</p>}
        {pagos && <MediosPagoSeccion precio={precio} pagos={pagos} />}
      </div>
    </div>
  );
}

export default function ProductoDetallePage() {
  const { slug } = useParams();
  const producto = useProducto(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Ubicación" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-texto-suave">
        <Link to="/catalogo" className="hover:text-texto">
          {nombreProductos}
        </Link>
        {producto.data?.categoria && (
          <>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link to={`/catalogo?categoria=${producto.data.categoria.id}`} className="hover:text-texto">
              {producto.data.categoria.nombre}
            </Link>
          </>
        )}
      </nav>
      {producto.isPending ? (
        <Cargando />
      ) : producto.isError ? (
        <ErrorCarga error={producto.error} onReintentar={producto.refetch} />
      ) : (
        <Detalle key={producto.data.id} producto={producto.data} />
      )}
    </div>
  );
}
