import multer from "multer";
import { DatosInvalidos, ErrorApp } from "./errores.js";

/**
 * Middleware para recibir UN archivo (multipart/form-data) en memoria.
 * Convierte los errores de multer en errores con mensaje en español.
 *
 *   router.post("/", recibirArchivo({ campo: "imagen", maxMb: 5, extensiones: [".jpg", ".png"] }), controlador)
 */
export function recibirArchivo({ campo, maxMb, extensiones, mensajeTipo }) {
  const subida = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1, fields: 10, fieldSize: 64 * 1024 },
    fileFilter: (_req, archivo, cb) => {
      const nombre = archivo.originalname.toLowerCase();
      const valido = extensiones.some((ext) => nombre.endsWith(ext));
      cb(valido ? null : new DatosInvalidos(mensajeTipo, [], "TIPO_DE_ARCHIVO_INVALIDO"), valido);
    },
  }).single(campo);

  return (req, res, next) =>
    subida(req, res, (error) => {
      if (!error) return next();
      if (error instanceof ErrorApp) return next(error);
      if (error.code === "LIMIT_FILE_SIZE") return next(new ErrorApp(413, "ARCHIVO_DEMASIADO_GRANDE", `El archivo supera ${maxMb} MB.`));
      return next(new DatosInvalidos("El archivo o el formulario no son válidos."));
    });
}
