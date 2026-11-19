// Lee las hojas de la lista del cliente tal como vienen (sin encabezado fijo: PRE-31).
// Corre en un worker con los mismos límites que el lector del core, para no trabar el servidor.
import ExcelJS from "exceljs";
import { Worker } from "node:worker_threads";
import { listaPreciosClienteConfig as config } from "../../../../../../rubros/eccomerce_distribuidora/lista_precios_cliente_config.js";

const fallar = (mensaje) => { throw Object.assign(new Error(mensaje), { status: 400 }); };

function valorCelda(celda) {
  const v = celda.value;
  if (v == null) return "";
  if (typeof v !== "object") return v;
  if (v.error) return "";
  if ("formula" in v || "sharedFormula" in v) return v.result ?? "";
  if (v.richText) return v.richText.map((p) => p.text).join("");
  if (v.text != null) return String(v.text);
  return "";
}

/**
 * { hojas: { LISTA: [{ numero, valores }], … }, disponibles: ["LISTA", …] } solo de las hojas pedidas.
 * Se carga el libro entero (la lista pesa cientos de KB): el lector por partes de ExcelJS falla con los
 * archivos que no traen primero la definición del libro. La memoria la limita el worker.
 */
export async function leerHojasCliente(buffer, nombres) {
  if (buffer.length > config.maxBytes) fallar("El archivo supera 20 MB.");
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer, { ignoreNodes: ["dataValidations", "hyperlinks", "conditionalFormatting"] });
  if (libro.worksheets.length > config.maxSheets) fallar("Demasiadas hojas.");
  const buscadas = new Map(nombres.map((n) => [n.trim().toLowerCase(), n]));
  const hojas = {}, disponibles = [];
  let celdas = 0;
  for (const hoja of libro.worksheets) {
    const nombre = String(hoja.name ?? "").trim();
    disponibles.push(nombre);
    const destino = buscadas.get(nombre.toLowerCase());
    if (!destino) continue;
    const filas = (hojas[destino] = []);
    hoja.eachRow((fila, numero) => {
      celdas += fila.cellCount;
      if (celdas > config.maxCells) fallar("El libro supera el límite de celdas.");
      if (fila.cellCount > config.maxColumns) fallar("Demasiadas columnas.");
      if (filas.length >= config.maxRows) fallar("La hoja supera " + config.maxRows + " filas.");
      filas.push({ numero, valores: Array.from({ length: fila.cellCount }, (_, i) => valorCelda(fila.getCell(i + 1))) });
    });
  }
  return { hojas, disponibles };
}

export function leerListaCliente(buffer, nombreArchivo) {
  if (!/\.xlsx$/i.test(nombreArchivo ?? "")) return Promise.reject(Object.assign(new Error("Subí el Excel (.xlsx) que exporta el sistema. Si es .xls, guardalo como .xlsx."), { status: 400 }));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./lector_lista_cliente_worker.js", import.meta.url), {
      workerData: { buffer, nombres: [config.hojaPrincipal, config.hojaComparacion] }, resourceLimits: { maxOldGenerationSizeMb: 256 },
    });
    const error = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
    const reloj = setTimeout(() => { worker.terminate(); reject(error("El archivo tardó demasiado en leerse.")); }, config.parseTimeoutMs);
    worker.once("message", (r) => { clearTimeout(reloj); worker.terminate(); if (r.error) reject(error(r.error)); else resolve(r.data); });
    worker.once("error", () => { clearTimeout(reloj); reject(error("No se pudo leer el archivo. Revisá que sea el Excel de la lista de precios.")); });
    worker.once("exit", (codigo) => { clearTimeout(reloj); if (codigo !== 0) reject(error("La lectura se interrumpió.")); });
  });
}
