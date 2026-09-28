import { parentPort, workerData } from "node:worker_threads";
import { leerPlanilla } from "./lector_planilla.js";

try {
  const datos = await leerPlanilla(Buffer.from(workerData.buffer), workerData.nombreArchivo, workerData.opciones);
  parentPort.postMessage({ datos });
} catch (error) {
  parentPort.postMessage({ error: error.paraUsuario ? error.message : "No se pudo leer el archivo. Revisá que sea un Excel o CSV válido." });
}
