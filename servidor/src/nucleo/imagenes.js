import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { DatosInvalidos, ErrorApp } from "./errores.js";

// Adaptado de DistribuCG (services/common/upload_service.js). El resto del sistema
// no conoce Cloudinary: usa subir() / eliminar(). Los tests reemplazan el almacén.

let almacen = null;

function almacenCloudinary() {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return {
    subir: (buffer, { carpeta }) =>
      new Promise((resolver, rechazar) => {
        const destino = cloudinary.uploader.upload_stream(
          {
            folder: `${env.CLOUDINARY_CARPETA}/${carpeta}`,
            resource_type: "image",
            // Achica fotos enormes y entrega el mejor formato a cada navegador.
            transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
          },
          (error, resultado) => (error ? rechazar(error) : resolver({ url: resultado.secure_url, public_id: resultado.public_id })),
        );
        Readable.from(buffer).pipe(destino);
      }),
    eliminar: (public_id) => cloudinary.uploader.destroy(public_id),
  };
}

function obtenerAlmacen() {
  if (almacen) return almacen;
  if (!env.imagenesConfiguradas) {
    throw new ErrorApp(503, "IMAGENES_NO_CONFIGURADAS", "La subida de imágenes todavía no está configurada. Mientras tanto podés agregar la imagen pegando su dirección (URL).");
  }
  almacen = almacenCloudinary();
  return almacen;
}

export async function subirImagen(buffer, { carpeta }) {
  const destino = obtenerAlmacen();
  try {
    return await destino.subir(buffer, { carpeta });
  } catch (error) {
    if (error?.http_code === 400) throw new DatosInvalidos("No se pudo procesar la imagen. Probá con un JPG, PNG o WEBP.");
    console.error("Error al subir imagen:", error?.message);
    throw new ErrorApp(502, "SERVICIO_IMAGENES_NO_DISPONIBLE", "El servicio de imágenes no respondió. Intentá de nuevo en unos minutos.");
  }
}

/** Borra la imagen del almacén. Si falla no interrumpe: la imagen ya no está en la base. */
export async function eliminarImagenGuardada(public_id) {
  if (!public_id || (!almacen && !env.imagenesConfiguradas)) return;
  try {
    await obtenerAlmacen().eliminar(public_id);
  } catch (error) {
    console.error("No se pudo borrar la imagen del almacén:", public_id, error?.message);
  }
}

/** Solo para tests: reemplaza Cloudinary por un almacén falso. */
export function usarAlmacenImagenes(otro) {
  almacen = otro;
}
