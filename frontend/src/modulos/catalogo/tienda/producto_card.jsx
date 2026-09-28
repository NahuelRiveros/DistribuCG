import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { ANCHOS, urlImagen } from "@/utils/imagenes.js";
import Insignia from "@/componentes/ui/insignia.jsx";
import { leyendaIva, precioVisible, presentacionMasBarata } from "../utils/precios.js";
import { productoAgotado } from "../utils/disponibilidad.js";
import { conDescuento, mejorDescuento } from "compartido/reglas/pagos.js";
import { usePagos } from "@/hooks/use_pagos.js";

/** `ancho`: el tamaño en que se muestra (Cloudinary entrega la foto a esa medida, no la original). */
export function ImagenProducto({ imagen, nombre, className = "", ancho = ANCHOS.tarjeta, prioridad = false }) {
  if (!imagen) {
    return (
      <div className={`flex items-center justify-center bg-fondo text-texto-suave ${className}`} aria-hidden="true">
        <Package className="h-10 w-10" />
      </div>
    );
  }
  return (
    <img
      src={urlImagen(imagen.url, ancho)}
      alt={imagen.alt || nombre}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}

export default function ProductoCard({ producto }) {
  const masBarata = presentacionMasBarata(producto);
  const varias = producto.variantes.length > 1;
  const agotado = productoAgotado(producto);
  // El mejor descuento por medio de pago (ej. transferencia) se muestra también en el listado.
  const { data: pagos } = usePagos();
  const descuento = pagos ? mejorDescuento(pagos) : null;

  return (
    <Link
      to={`/catalogo/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-borde bg-superficie transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <ImagenProducto imagen={producto.imagenes?.[0]} nombre={producto.nombre} className={`aspect-square w-full ${agotado ? "opacity-60 grayscale" : ""}`} />
        {agotado && (
          <span className="absolute left-2 top-2">
            <Insignia tono="peligro">Sin stock</Insignia>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-texto-suave">{producto.categoria?.nombre}</p>
        <h3 className="mt-1 font-semibold group-hover:text-primario">{producto.nombre}</h3>
        {producto.marca && <p className="text-sm text-texto-suave">{producto.marca}</p>}
        {masBarata && (
          <div className="mt-auto pt-3">
            {masBarata.precio_anterior && (
              <p className="text-sm text-texto-suave line-through">{formatearDinero(precioVisible(masBarata.precio_anterior, masBarata.iva_porcentaje))}</p>
            )}
            <p className="text-lg font-bold">
              {varias && <span className="text-sm font-normal text-texto-suave">Desde </span>}
              {formatearDinero(precioVisible(masBarata.precio, masBarata.iva_porcentaje))}
            </p>
            <p className="text-xs text-texto-suave">{leyendaIva}</p>
            {descuento && (
              <p className="mt-1 text-sm">
                <strong className="tabular-nums">{formatearDinero(conDescuento(precioVisible(masBarata.precio, masBarata.iva_porcentaje), descuento.descuento).total)}</strong>{" "}
                <span className="text-texto-suave">con {descuento.etiqueta.toLowerCase()}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
