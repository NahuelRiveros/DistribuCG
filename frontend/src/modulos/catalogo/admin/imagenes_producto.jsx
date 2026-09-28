import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Trash2 } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import ConfirmDialog from "@/componentes/ui/confirm_dialog.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import { cn } from "@/utils/cn.js";
import { useAgregarImagenUrl, useEliminarImagen, useOrdenarImagenes, useSubirImagen } from "../hooks/use_catalogo.js";

const MAXIMO = proyecto.catalogo.max_imagenes_producto;
const MAX_MB = 5;

/** Galería del producto: subir (arrastrando o eligiendo), pegar URL, ordenar y quitar. */
export default function ImagenesProducto({ producto }) {
  const toast = useToast();
  const entrada = useRef(null);
  const subir = useSubirImagen();
  const porUrl = useAgregarImagenUrl();
  const ordenar = useOrdenarImagenes();
  const eliminar = useEliminarImagen();
  const [progreso, setProgreso] = useState(null); // "Subiendo 1 de 3..."
  const [arrastrando, setArrastrando] = useState(false);
  const [url, setUrl] = useState("");
  const [aEliminar, setAEliminar] = useState(null);

  const imagenes = producto.imagenes;
  const lugar = MAXIMO - imagenes.length;
  const ocupado = Boolean(progreso) || porUrl.isPending || ordenar.isPending;

  async function subirArchivos(lista) {
    const archivos = [...lista].slice(0, lugar);
    if (lista.length > lugar) toast.info(`Se suben solo ${lugar}: el máximo es ${MAXIMO} imágenes.`);
    for (const [i, archivo] of archivos.entries()) {
      if (archivo.size > MAX_MB * 1024 * 1024) {
        toast.error(`"${archivo.name}" supera ${MAX_MB} MB.`);
        continue;
      }
      setProgreso(`Subiendo ${i + 1} de ${archivos.length}...`);
      try {
        await subir.mutateAsync({ productoId: producto.id, archivo });
      } catch (error) {
        toast.error(mensajeDeError(error));
        break; // si el servicio falla, no seguir intentando con el resto
      }
    }
    setProgreso(null);
  }

  async function agregarUrl(e) {
    e.preventDefault();
    try {
      await porUrl.mutateAsync({ productoId: producto.id, url });
      setUrl("");
    } catch (error) {
      toast.error(mensajeDeError(error));
    }
  }

  async function mover(indice, delta) {
    const ids = imagenes.map((img) => img.id);
    [ids[indice], ids[indice + delta]] = [ids[indice + delta], ids[indice]];
    try {
      await ordenar.mutateAsync({ productoId: producto.id, ids });
    } catch (error) {
      toast.error(mensajeDeError(error));
    }
  }

  async function confirmarEliminar() {
    try {
      await eliminar.mutateAsync({ productoId: producto.id, imagenId: aEliminar.id });
    } catch (error) {
      toast.error(mensajeDeError(error));
    } finally {
      setAEliminar(null);
    }
  }

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5" aria-labelledby="titulo-imagenes">
      <h2 id="titulo-imagenes" className="text-lg font-bold">
        Imágenes
      </h2>
      <p className="text-sm text-texto-suave">
        La primera es la principal (la que se ve en el catálogo). Hasta {MAXIMO} imágenes de {MAX_MB} MB.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5" aria-label="Imágenes del producto">
        {imagenes.map((img, i) => (
          <li key={img.id} className="overflow-hidden rounded-xl border border-borde">
            <div className="relative">
              <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2">
                  <Insignia tono="info">Principal</Insignia>
                </span>
              )}
            </div>
            <div className="flex justify-between p-1">
              <Boton variante="fantasma" tamano="icono" onClick={() => mover(i, -1)} disabled={i === 0 || ocupado} aria-label={`Mover imagen ${i + 1} antes`}>
                <ArrowLeft className="h-4 w-4" />
              </Boton>
              <Boton variante="fantasma" tamano="icono" onClick={() => setAEliminar(img)} aria-label={`Quitar imagen ${i + 1}`}>
                <Trash2 className="h-4 w-4 text-peligro" />
              </Boton>
              <Boton variante="fantasma" tamano="icono" onClick={() => mover(i, 1)} disabled={i === imagenes.length - 1 || ocupado} aria-label={`Mover imagen ${i + 1} después`}>
                <ArrowRight className="h-4 w-4" />
              </Boton>
            </div>
          </li>
        ))}

        {lugar > 0 && (
          <li>
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                subirArchivos(e.dataTransfer.files);
              }}
              disabled={ocupado}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-2 text-center text-xs text-texto-suave transition",
                arrastrando ? "border-primario bg-primario/10" : "border-borde hover:border-primario",
              )}
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              {progreso ?? "Subir imágenes (o arrastralas acá)"}
            </button>
            <input
              ref={entrada}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              className="hidden"
              aria-label="Elegir imágenes"
              onChange={(e) => {
                subirArchivos(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        )}
      </ul>

      {lugar > 0 && (
        <form onSubmit={agregarUrl} className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <InputField label="O pegá la dirección de una imagen" name="url_imagen" icon={Link2} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Boton type="submit" variante="secundario" disabled={!url.trim() || ocupado}>
            Agregar
          </Boton>
        </form>
      )}

      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        titulo="Quitar imagen"
        mensaje="La imagen se quita del producto."
        textoConfirmar="Quitar"
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setAEliminar(null)}
      />
    </section>
  );
}
