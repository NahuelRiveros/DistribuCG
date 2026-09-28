import { Worker } from "node:worker_threads";
import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";
import { DatosInvalidos } from "../../../nucleo/errores.js";

/**
 * Lee el Excel/CSV en un hilo aparte (traído de DistribuCG): con tiempo y memoria
 * limitados, un archivo enorme o dañado no bloquea ni tira abajo el servidor.
 */
export function leerArchivo(buffer, nombreArchivo, opciones) {
  return new Promise((resolver, rechazar) => {
    const trabajador = new Worker(new URL("./lector_worker.js", import.meta.url), {
      workerData: { buffer, nombreArchivo, opciones },
      resourceLimits: { maxOldGenerationSizeMb: 256 },
    });
    const error = (mensaje) => new DatosInvalidos(mensaje, [], "ARCHIVO_ILEGIBLE");
    const reloj = setTimeout(() => {
      trabajador.terminate();
      rechazar(error("El archivo tardó demasiado en leerse. Probá con un archivo más chico."));
    }, config.tiempoLecturaMs);

    trabajador.once("message", (r) => {
      clearTimeout(reloj);
      trabajador.terminate();
      if (r.error) rechazar(error(r.error));
      else resolver(r.datos);
    });
    trabajador.once("error", () => {
      clearTimeout(reloj);
      rechazar(error("No se pudo procesar el tamaño o el contenido del archivo. Dividilo y reintentá."));
    });
    trabajador.once("exit", (codigo) => {
      clearTimeout(reloj);
      if (codigo !== 0) rechazar(error("La lectura del archivo se interrumpió."));
    });
  });
}
