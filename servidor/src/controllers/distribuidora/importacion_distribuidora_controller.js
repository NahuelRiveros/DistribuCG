import ExcelJS from "exceljs";
import { once } from "node:events";
import { previewFile, validateImport, getImport, listImports, executeBatch, cancelImport, importReport } from "../../services/distribuidora/importacion_distribuidora_service.js";
import { importError } from "../../services/distribuidora/importacion/normalize.js";
const jsonField = (req, name) => {
  try { const value = JSON.parse(req.body?.[name] || "{}"); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); return value; }
  catch { throw importError("El campo " + name + " es inválido."); }
};
const action = (fn) => async (req, res) => {
  try { res.json({ ok: true, data: await fn(req) }); }
  catch (e) {
    if (!e.status) console.error("Importación:", e.name);
    res.status(e.status || 500).json({ ok: false, mensaje: e.status ? e.message : "El lote no se guardó. Reintentá; si persiste, revisá el archivo o los cambios recientes del catálogo." });
  }
};
const file = (req) => { if (!req.file) throw importError("Seleccioná un archivo .xlsx o CSV."); return req.file; };
export const previsualizarImportacionController = action((req) => previewFile(file(req).buffer, req.file.originalname, jsonField(req, "opciones")));
export const validarImportacionController = action((req) => validateImport(file(req).buffer, req.file.originalname, jsonField(req, "mapeo"), jsonField(req, "opciones"), req.body.key, req.user.usuario_id));
export const detalleImportacionController = action((req) => getImport(req.params.id, req.user.usuario_id));
export const historialImportacionController = action((req) => listImports(req.user.usuario_id));
export const ejecutarImportacionController = action((req) => executeBatch(req.params.id, req.user.usuario_id, req.body));
export const cancelarImportacionController = action((req) => cancelImport(req.params.id, req.user.usuario_id));
export async function informeImportacionController(req, res, next) {
  try {
    await getImport(req.params.id, req.user.usuario_id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="importacion-' + req.params.id + '.csv"');
    for await (const chunk of importReport(req.params.id, req.user.usuario_id)) {
      if (res.destroyed) break;
      if (!res.write(chunk)) await once(res, "drain");
    }
    res.end();
  } catch (error) { if (res.headersSent) res.destroy(); else next(error); }
}
export async function plantillaImportacionController(_req, res, next) {
  try {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Productos");
    sheet.columns = [
      { header: "SKU", key: "sku", width: 20, style: { numFmt: "@" } },
      { header: "Producto", key: "name", width: 32 }, { header: "Presentación", key: "variant", width: 25 },
      { header: "Categoría", key: "category", width: 32 }, { header: "Precio", key: "price", width: 18 },
      { header: "IVA", key: "vat", width: 14 }, { header: "Stock", key: "stock", width: 14 }, { header: "Marca", key: "brand", width: 22 },
    ];
    sheet.addRow({ sku: "000123", name: "Arroz de ejemplo", variant: "Paquete 1 kg", category: "Almacén > Arroz", price: 1000, vat: 21, stock: 25, brand: "Marca de ejemplo" });
    sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }];
    const help = book.addWorksheet("Instrucciones");
    help.getColumn(1).width = 110;
    ["Plantilla de ejemplo: reemplazar el producto antes de importar.", "Una fila por SKU/presentación. SKU como texto para conservar ceros.", "Precio de ejemplo NETO sin IVA: 1000 + 21% = 1210.", "El importador permite seleccionar hoja, encabezado y columnas.", "Stock vacío no activa control de stock en altas; en actualizaciones conserva lo existente."].forEach((text) => help.addRow([text]));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="plantilla-catalogo.xlsx"');
    await book.xlsx.write(res); res.end();
  } catch (e) { next(e); }
}
