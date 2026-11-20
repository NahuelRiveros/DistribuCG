import { limitesImportacion } from "../../core/importacion_config.js";

export const catalogImportConfig = {
  ...limitesImportacion, version: 2, batchSize: 250,
  defaults: { headerRow: 1, sheet: 1, delimiter: "auto", encoding: "utf-8", decimal: "comma", priceType: "net", defaultVat: 21, category: "", identity: "sku", mode: "upsert", updateFields: ["precio"] },
  fields: [
    { key: "cod_ref", label: "Código / SKU", aliases: ["codigo", "código", "sku", "cod_ref", "codigo articulo", "cod articulo", "articulo codigo"], help: "Identificador estable de cada presentación. Conservar ceros iniciales." },
    { key: "codigo_barras", label: "Código de barras", aliases: ["codigo de barras", "cod barras", "barras", "ean", "ean13", "upc"], help: "Entre 6 y 14 números. En existentes solo se completa si estaba vacío." },
    { key: "producto_nombre", label: "Nombre del producto", aliases: ["producto", "articulo", "artículo", "nombre", "descripcion articulo", "detalle"] },
    { key: "precio", label: "Precio", aliases: ["precio", "precio venta", "pvp", "precio lista"], help: "Precio final de venta. Si la fila trae costo neto y rentabilidad, el precio se calcula y esta columna se ignora." },
    // PRE-66: con los dos, precio = costo × (1 + rentabilidad) × (1 + IVA), en pesos enteros.
    { key: "costo_neto", label: "Costo neto", aliases: ["costo", "costo neto", "costo sin iva", "precio costo", "precio de costo"], help: "Lo que cobra el proveedor, sin IVA. Opcional." },
    { key: "rentabilidad", label: "Rentabilidad %", aliases: ["rentabilidad", "% rentabilidad", "margen", "margen %", "% margen", "ganancia %"], help: "Ganancia sobre el costo (30 = 30 %). Opcional; sin ella, el precio es el de la columna Precio." },
    { key: "categoria", label: "Categoría", aliases: ["categoria", "categoría", "rubro", "familia"], help: "Admite Almacén > Galletitas." },
    { key: "variedad_nombre", label: "Presentación", aliases: ["variedad", "presentacion", "presentación", "unidad", "envase"] },
    { key: "marca", label: "Marca", aliases: ["marca", "fabricante"] },
    { key: "descripcion", label: "Descripción ampliada", aliases: ["descripcion", "descripción", "observaciones"] },
    { key: "iva_porcentaje", label: "IVA (%)", aliases: ["iva", "% iva", "iva_porcentaje", "alicuota"] },
    { key: "cantidad", label: "Stock", aliases: ["stock", "cantidad", "existencia", "existencias", "saldo"], help: "En existentes, solo se reemplaza si habilitás Actualizar stock." },
    { key: "unidades_por_bulto", label: "Unidades por bulto", aliases: ["unidades por bulto", "unidades por caja", "unid x caja", "uxb", "equivalencia", "x bulto"], help: "Cuántas unidades trae la caja (ej. 20). En existentes solo se completa si no tenía bulto." },
  ],
  modes: [{ value: "upsert", label: "Crear nuevos y actualizar existentes" }, { value: "create", label: "Solo crear nuevos" }, { value: "update", label: "Solo actualizar existentes" }],
};
export const normalizeHeader = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function suggestMapping(columns) {
  const result = {}, used = new Set();
  for (const field of catalogImportConfig.fields) {
    const candidates = columns.filter((c) => field.aliases.some((a) => normalizeHeader(a) === normalizeHeader(c.name)));
    if (candidates.length === 1 && !used.has(candidates[0].key)) { result[field.key] = candidates[0].key; used.add(candidates[0].key); }
  }
  return result;
}
