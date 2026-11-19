import { parentPort, workerData } from "node:worker_threads";
import { leerHojasCliente } from "./lector_lista_cliente.js";
try { parentPort.postMessage({ data: await leerHojasCliente(Buffer.from(workerData.buffer), workerData.nombres) }); }
catch (error) { parentPort.postMessage({ error: error.status ? error.message : "No se pudo leer el archivo. Revisá que sea un Excel válido." }); }
