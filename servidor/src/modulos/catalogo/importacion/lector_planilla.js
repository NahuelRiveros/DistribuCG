import ExcelJS from "exceljs";
import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";

// Traído de DistribuCG (services/common/importacion/spreadsheet_reader.js).
// Corre dentro de un worker (ver leer_archivo.js). Los errores "para el usuario"
// llevan `paraUsuario: true` y su mensaje se muestra tal cual.

const fallar = (mensaje) => {
  throw Object.assign(new Error(mensaje), { paraUsuario: true });
};

/** CSV con comillas, separador ; , o tabulación (autodetectado en la primera línea). */
export function leerCsv(texto, separador = "auto") {
  texto = texto.replace(/^\uFEFF/, "");
  if (separador === "auto") {
    const cuentas = { ";": 0, ",": 0, "\t": 0 };
    let entreComillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (c === '"') {
        if (entreComillas && texto[i + 1] === '"') i++;
        else entreComillas = !entreComillas;
      }
      if (!entreComillas && (c === "\r" || c === "\n")) break;
      if (!entreComillas && c in cuentas) cuentas[c]++;
    }
    separador = Object.keys(cuentas).sort((a, b) => cuentas[b] - cuentas[a])[0];
  }
  if (![";", ",", "\t"].includes(separador)) fallar("Separador CSV inválido.");

  const filas = [];
  let fila = [];
  let valor = "";
  let entreComillas = false;
  let cerrada = false;
  const celda = () => {
    fila.push(valor);
    valor = "";
    cerrada = false;
    if (fila.length > config.maxColumnas) fallar("Demasiadas columnas.");
  };
  const registro = () => {
    celda();
    filas.push(fila);
    fila = [];
    if (filas.length > config.maxFilas + 50) fallar("El archivo supera el límite de filas.");
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          valor += '"';
          i++;
        } else {
          entreComillas = false;
          cerrada = true;
        }
      } else valor += c;
    } else if (c === '"') {
      if (valor || cerrada) fallar("CSV inválido: comillas sin escapar.");
      entreComillas = true;
    } else if (c === separador) celda();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      registro();
    } else if (cerrada) {
      if (c !== " ") fallar("CSV inválido: texto después del cierre de comillas.");
    } else valor += c;
    if (valor.length > config.maxLargoCelda) fallar("Una celda supera el largo permitido.");
  }
  if (entreComillas) fallar("CSV inválido: faltan cerrar comillas.");
  if (valor || fila.length || cerrada) registro();
  return { filas, separador };
}

function valorCelda(celda) {
  const v = celda.value;
  if (v == null) return "";
  if (typeof v === "number") {
    // Códigos con formato "000123" en Excel: recuperar los ceros iniciales.
    if (Number.isInteger(v) && /^0{2,}$/.test(celda.numFmt || "")) return String(v).padStart(celda.numFmt.length, "0");
    return v;
  }
  if (typeof v === "object") {
    if (v.error) return "#ERROR:" + v.error;
    if ("formula" in v || "sharedFormula" in v) return v.result ?? "#FORMULA_SIN_RESULTADO";
    if (v.richText) return v.richText.map((p) => p.text).join("");
    if (v.text != null) return String(v.text);
    if (v instanceof Date) return v.toISOString();
  }
  return String(v);
}

export async function leerPlanilla(buffer, nombreArchivo, opciones = {}) {
  const filaEncabezado = Number(opciones.fila_encabezado ?? 1);
  const hojaElegida = Number(opciones.hoja ?? 1);
  if (!Number.isInteger(filaEncabezado) || filaEncabezado < 1 || filaEncabezado > 50) fallar("La fila de encabezados debe estar entre 1 y 50.");
  if (!Number.isInteger(hojaElegida) || hojaElegida < 1 || hojaElegida > config.maxHojas) fallar("Hoja inválida.");
  if (buffer.length > config.maxMb * 1024 * 1024) fallar(`El archivo supera ${config.maxMb} MB.`);

  const hojas = [];
  let encabezados = null;
  const filas = [];
  let celdas = 0;
  let separador = opciones.separador || "auto";

  function consumir(valores, numero) {
    celdas += valores.length;
    if (celdas > config.maxCeldas) fallar("Demasiadas celdas. Dividí el catálogo en archivos más chicos.");
    if (valores.length > config.maxColumnas) fallar("Demasiadas columnas.");
    if (valores.some((v) => String(v ?? "").length > config.maxLargoCelda)) fallar("Una celda supera el largo permitido.");
    if (numero === filaEncabezado) {
      encabezados = valores.map((v) => String(v ?? "").trim());
      return;
    }
    if (numero < filaEncabezado || !valores.some((v) => v !== "" && v != null)) return;
    if (filas.length >= config.maxFilas) fallar(`El archivo supera ${config.maxFilas} filas.`);
    filas.push({ numero, valores });
  }

  if (/\.csv$/i.test(nombreArchivo)) {
    const codificacion = opciones.codificacion || "utf-8";
    if (!["utf-8", "windows-1252"].includes(codificacion)) fallar("Codificación no admitida.");
    let texto;
    try {
      texto = new TextDecoder(codificacion, { fatal: true }).decode(buffer);
    } catch {
      fallar("El CSV no está en UTF-8. Probá con la codificación Windows-1252.");
    }
    const resultado = leerCsv(texto, separador);
    separador = resultado.separador;
    hojas.push({ valor: 1, etiqueta: "CSV" });
    if (hojaElegida !== 1) fallar("Un CSV tiene una sola hoja.");
    resultado.filas.forEach((f, i) => consumir(f, i + 1));
  } else if (/\.xlsx$/i.test(nombreArchivo)) {
    // Lectura completa (no streaming): el lector streaming de exceljs falla de forma intermitente
    // cuando el .xlsx guarda las hojas antes que workbook.xml ("reading 'sheets'").
    // La memoria queda acotada por el tope de MB y el límite del worker (leer_archivo.js).
    const libro = new ExcelJS.Workbook();
    try {
      await libro.xlsx.load(buffer);
    } catch {
      fallar("No se pudo abrir el Excel. Revisá que sea un archivo .xlsx válido.");
    }
    if (libro.worksheets.length > config.maxHojas) fallar("Demasiadas hojas.");
    libro.worksheets.forEach((h, i) => hojas.push({ valor: i + 1, etiqueta: h.name || `Hoja ${i + 1}` }));
    const hoja = libro.worksheets[hojaElegida - 1];
    if (!hoja) fallar("La hoja elegida no existe.");
    hoja.eachRow({ includeEmpty: false }, (fila, numero) => {
      consumir(Array.from({ length: fila.cellCount }, (_, i) => valorCelda(fila.getCell(i + 1))), numero);
    });
  } else {
    fallar("Usá un archivo .xlsx o .csv. Los .xls viejos se pueden guardar como .xlsx desde Excel.");
  }

  if (!encabezados?.some(Boolean)) fallar("No hay encabezados en esa fila. Elegí la fila que tiene los títulos de las columnas.");
  const ancho = Math.max(encabezados.length, ...filas.slice(0, config.filasMuestra).map((f) => f.valores.length));
  if (filas.some((f) => f.valores.length > ancho)) fallar("Hay filas con más columnas que el encabezado. Revisá el separador o la fila elegida.");
  const columnas = Array.from({ length: ancho }, (_, i) => ({
    clave: `c${i + 1}`,
    nombre: encabezados[i] || "",
    etiqueta: `${encabezados[i] || "Sin título"} · columna ${i + 1}`,
  }));
  return { columnas, filas, hojas, hoja: hojaElegida, separador, fila_encabezado: filaEncabezado };
}
