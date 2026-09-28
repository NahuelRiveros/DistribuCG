import { proyecto } from "./proyecto.js";
import { quitarAcentos } from "./reglas/texto.js";

// Importación de catálogo desde Excel/CSV (adaptado de DistribuCG: catalog_import_config.js).
// La leen el servidor (validación) y el frontend (asistente y sugerencia de columnas).
// La columna Stock aparece solo si el módulo stock está activo: la cantidad del archivo
// no pisa el saldo, se registra la diferencia como movimiento "importacion".

const conStock = proyecto.modulos.stock;

export const importacionCatalogo = {
  // Subir si cambian las reglas: las importaciones validadas con otra versión se rechazan.
  version: 2,
  maxMb: 20,
  maxFilas: 50_000,
  maxColumnas: 80,
  maxCeldas: 1_500_000,
  maxHojas: 30,
  maxLargoCelda: 5000,
  tamanoLote: 250,
  filasMuestra: 12,
  tiempoLecturaMs: 60_000,

  opcionesPorDefecto: {
    hoja: 1,
    fila_encabezado: 1,
    separador: "auto",
    codificacion: "utf-8",
    decimal: "coma",
    tipo_precio: "neto",
    iva_por_defecto: proyecto.catalogo.iva_por_defecto,
    categoria_por_defecto: "",
    identidad: "sku",
    modo: "crear_actualizar",
    actualizar: ["precio"],
  },

  campos: [
    { clave: "sku", etiqueta: "Código / SKU", alias: ["codigo", "código", "sku", "cod_ref", "codigo articulo", "cod articulo", "ean", "codigo de barras"], ayuda: "Identifica cada presentación. Conservá los ceros iniciales." },
    { clave: "producto", etiqueta: "Nombre del producto", alias: ["producto", "articulo", "artículo", "nombre", "descripcion articulo", "detalle"] },
    { clave: "precio", etiqueta: "Precio", alias: ["precio", "precio venta", "pvp", "precio lista"], ayuda: "Una sola lista de precios. Indicá abajo si incluye IVA." },
    { clave: "categoria", etiqueta: "Categoría", alias: ["categoria", "categoría", "rubro", "familia"], ayuda: "Admite niveles: Almacén > Galletitas." },
    { clave: "presentacion", etiqueta: proyecto.catalogo.etiqueta_variante, alias: ["presentacion", "presentación", "variedad", "variante", "unidad", "envase"] },
    { clave: "marca", etiqueta: "Marca", alias: ["marca", "fabricante"] },
    { clave: "descripcion", etiqueta: "Descripción", alias: ["descripcion", "descripción", "observaciones"] },
    { clave: "iva_porcentaje", etiqueta: "IVA (%)", alias: ["iva", "% iva", "iva_porcentaje", "alicuota", "alícuota"] },
    ...(conStock
      ? [{ clave: "stock", etiqueta: "Stock", alias: ["stock", "cantidad", "existencia", "existencias", "saldo"], ayuda: "Cantidad actual. Se registra la diferencia como movimiento." }]
      : []),
  ],

  modos: [
    { valor: "crear_actualizar", etiqueta: "Crear nuevos y actualizar existentes" },
    { valor: "crear", etiqueta: "Solo crear nuevos" },
    { valor: "actualizar", etiqueta: "Solo actualizar existentes" },
  ],
  // Qué se puede actualizar en productos existentes (nombre, marca, imágenes, etc. nunca se pisan).
  camposActualizables: [
    { valor: "precio", etiqueta: "Precio" },
    { valor: "iva_porcentaje", etiqueta: "IVA" },
    ...(conStock ? [{ valor: "stock", etiqueta: "Stock" }] : []),
  ],
};

export const normalizarEncabezado = (v) =>
  quitarAcentos(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Asocia columnas del archivo con campos cuando el encabezado coincide con un alias (sin ambigüedad). */
export function sugerirMapeo(columnas) {
  const mapeo = {};
  const usadas = new Set();
  for (const campo of importacionCatalogo.campos) {
    const alias = new Set(campo.alias.map(normalizarEncabezado));
    const candidatas = columnas.filter((c) => alias.has(normalizarEncabezado(c.nombre)));
    if (candidatas.length === 1 && !usadas.has(candidatas[0].clave)) {
      mapeo[campo.clave] = candidatas[0].clave;
      usadas.add(candidatas[0].clave);
    }
  }
  return mapeo;
}
