import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";
import { DatosInvalidos } from "../../../nucleo/errores.js";

// Adaptado de DistribuCG (services/distribuidora/importacion/normalize.js).

/** Error de UNA fila: la fila queda marcada con error y el resto sigue. */
class ErrorFila extends Error {}

export const claveTexto = (v) => String(v ?? "").trim().toLocaleLowerCase("es-AR");

/** Números escritos como texto según el formato elegido: "1.234,56" (coma) o "1,234.56" (punto). */
export function numero(crudo, decimal, etiqueta) {
  if (typeof crudo === "number") {
    if (!Number.isFinite(crudo)) throw new ErrorFila(`${etiqueta} inválido.`);
    return crudo;
  }
  let texto = String(crudo ?? "")
    .trim()
    .replace(/^(ARS|\$)\s*/i, "")
    .replace(/\s*%$/, "")
    .trim();
  const coma = decimal === "coma";
  const patron = coma ? /^\d+(?:,\d+)?$|^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/ : /^\d+(?:\.\d+)?$|^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
  if (!patron.test(texto)) throw new ErrorFila(`${etiqueta} inválido para el formato de números elegido.`);
  texto = coma ? texto.replaceAll(".", "").replace(",", ".") : texto.replaceAll(",", "");
  const n = Number(texto);
  if (!Number.isFinite(n)) throw new ErrorFila(`${etiqueta} inválido.`);
  return n;
}

const NOMBRES_CAMPO = { iva_porcentaje: "el IVA", stock: "el stock" };
const invalido = (mensaje) => new DatosInvalidos(mensaje, [], "IMPORTACION_INVALIDA");

/** Revisa opciones y mapeo contra las columnas leídas. Devuelve las opciones completas. */
export function validarOpciones(mapeo, opciones, columnas) {
  const o = { ...config.opcionesPorDefecto, ...opciones };
  if (!["coma", "punto"].includes(o.decimal) || !["neto", "final"].includes(o.tipo_precio) || !["sku", "nombre"].includes(o.identidad) || !config.modos.some((m) => m.valor === o.modo)) {
    throw invalido("Opciones de importación inválidas.");
  }
  if (!Array.isArray(o.actualizar) || o.actualizar.some((v) => !config.camposActualizables.some((c) => c.valor === v))) {
    throw invalido("Campos a actualizar inválidos.");
  }
  o.iva_por_defecto = Number(o.iva_por_defecto);
  if (!Number.isFinite(o.iva_por_defecto) || o.iva_por_defecto < 0 || o.iva_por_defecto > 100) throw invalido("IVA por defecto inválido.");
  if (typeof o.categoria_por_defecto !== "string" || o.categoria_por_defecto.length > 800) throw invalido("Categoría por defecto inválida.");
  if (!mapeo || typeof mapeo !== "object" || Array.isArray(mapeo)) throw invalido("Asignación de columnas inválida.");

  const claves = new Set(columnas.map((c) => c.clave));
  const usadas = new Set();
  for (const [campo, columna] of Object.entries(mapeo)) {
    if (!config.campos.some((c) => c.clave === campo) || (columna && !claves.has(columna))) throw invalido("La asignación no corresponde a las columnas del archivo.");
    if (columna && usadas.has(columna)) throw invalido("Cada columna se puede asignar a un solo campo.");
    if (columna) usadas.add(columna);
  }
  // El precio hace falta para crear productos o actualizar precios; no para actualizar solo stock o IVA.
  const soloActualizaSinPrecio = o.modo === "actualizar" && !o.actualizar.includes("precio");
  if (!mapeo.precio && !soloActualizaSinPrecio) throw invalido("Asigná la columna del precio.");
  if (o.identidad === "sku" && !mapeo.sku) throw invalido("Asigná la columna del código / SKU, o elegí reconocer los productos por nombre.");
  if ((o.modo !== "actualizar" || o.identidad === "nombre") && !mapeo.producto) throw invalido("Asigná la columna del nombre del producto.");
  for (const campo of o.actualizar) {
    if (campo !== "precio" && !mapeo[campo]) throw invalido(`Para actualizar ${NOMBRES_CAMPO[campo] ?? campo} tenés que asignar su columna.`);
  }
  return o;
}

/** Cada fila del archivo → { fila, valor } o { fila, accion: "error", mensaje }. */
export function normalizarFilas(leido, mapeo, opciones) {
  const indice = Object.fromEntries(leido.columnas.map((c, i) => [c.clave, i]));
  const celda = (fila, campo) => (mapeo[campo] ? fila.valores[indice[mapeo[campo]]] : undefined);
  const texto = (fila, campo, max, etiqueta) => {
    const crudo = celda(fila, campo);
    if (typeof crudo === "number" && campo === "sku" && !Number.isSafeInteger(crudo)) {
      throw new ErrorFila("El código perdió precisión en Excel. Exportalo como texto.");
    }
    const v = crudo == null ? "" : String(crudo).trim();
    if (v.startsWith("#ERROR") || v.startsWith("#FORMULA")) throw new ErrorFila(`${etiqueta} tiene una fórmula sin resultado válido.`);
    if (v.length > max) throw new ErrorFila(`${etiqueta} supera ${max} caracteres.`);
    return v || null;
  };

  return leido.filas.map((fila) => {
    try {
      const v = {
        sku: texto(fila, "sku", 60, "El código"),
        producto: texto(fila, "producto", 150, "El nombre"),
        presentacion: texto(fila, "presentacion", 100, "La presentación"),
        categoria: texto(fila, "categoria", 800, "La categoría") || opciones.categoria_por_defecto || null,
        marca: texto(fila, "marca", 80, "La marca"),
        descripcion: texto(fila, "descripcion", 5000, "La descripción"),
        importe: mapeo.precio ? numero(celda(fila, "precio"), opciones.decimal, "Precio") : null,
      };
      if (v.importe != null && (v.importe < 0 || v.importe > 9_999_999_999.99)) throw new ErrorFila("Precio fuera del rango permitido.");
      if (opciones.identidad === "sku" && !v.sku) throw new ErrorFila("Falta el código / SKU.");
      if ((opciones.modo !== "actualizar" || opciones.identidad === "nombre") && !v.producto) throw new ErrorFila("Falta el nombre del producto.");

      const niveles = v.categoria?.split(">").map((s) => s.trim()).filter(Boolean) ?? [];
      if (niveles.length > 10 || niveles.some((s) => s.length > 80)) throw new ErrorFila("La categoría admite hasta 10 niveles de 80 caracteres.");
      v.categoria = niveles.join(" > ") || null;

      const iva = celda(fila, "iva_porcentaje");
      v.iva_porcentaje = iva == null || String(iva).trim() === "" ? null : numero(iva, opciones.decimal, "IVA");
      if (v.iva_porcentaje != null && (v.iva_porcentaje < 0 || v.iva_porcentaje > 100 || Math.abs(v.iva_porcentaje * 100 - Math.round(v.iva_porcentaje * 100)) > 1e-6)) {
        throw new ErrorFila("IVA inválido (de 0 a 100, hasta 2 decimales).");
      }
      const stock = celda(fila, "stock");
      v.stock = stock == null || String(stock).trim() === "" ? null : numero(stock, opciones.decimal, "Stock");
      if (v.stock != null && (!Number.isInteger(v.stock) || v.stock < 0 || v.stock > 1_000_000)) {
        throw new ErrorFila("Stock inválido: tiene que ser un número entero, 0 o más.");
      }
      return { fila: fila.numero, valor: v };
    } catch (error) {
      if (!(error instanceof ErrorFila)) throw error;
      return { fila: fila.numero, accion: "error", mensaje: error.message };
    }
  });
}
