import { Op } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";
import { Usuario, ImportacionCatalogo as Job, ImportacionCatalogoLote as Batch } from "../../models/index.js";
import { catalogImportConfig as config } from "../../../../catalog_import_config.js";
import { readImportFile } from "../common/importacion/read_file.js";
import { validateSettings, normalizeRows, importError } from "./importacion/normalize.js";
import { buildPlan, summarize, hash } from "./importacion/plan.js";
import { loadCatalog, applyPlan } from "./importacion/catalog_repository.js";
const uuid = (id) => { if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id || "")) throw importError("Identificador inválido."); };
const publicRow = (r) => ({ row: r.row, sku: r.value?.cod_ref || "", name: r.value?.producto_nombre || "", action: r.action, message: r.message || "", previousPrice: r.previousPrice, finalPrice: r.finalPrice });
async function ownedJob(id, userId, transaction, lock = false) {
  uuid(id);
  const job = await Job.findOne({ where: { id, usuario_id: userId }, transaction, ...(lock ? { lock: transaction.LOCK.UPDATE } : {}) });
  if (!job) throw importError("Importación no encontrada.", 404);
  return job;
}
export async function previewFile(buffer, filename, options) {
  const parsed = await readImportFile(buffer, filename, options);
  return { ...parsed, rows: parsed.rows.slice(0, config.previewRows), total: parsed.rows.length };
}
export async function validateImport(buffer, filename, mapping, options, id, userId) {
  uuid(id);
  const fingerprint = hash([hash(buffer), mapping, options, config.version]);
  const previous = await Job.findOne({ where: { id, usuario_id: userId } });
  if (previous) {
    if (previous.huella !== fingerprint) throw importError("El identificador ya fue usado con otro archivo u opciones.", 409);
    return getImport(id, userId);
  }
  const parsed = await readImportFile(buffer, filename, options);
  if (!parsed.rows.length) throw importError("El archivo no contiene productos debajo del encabezado.");
  const settings = validateSettings(mapping, options, parsed.columns);
  const rows = normalizeRows(parsed, mapping, settings);
  const plan = buildPlan(rows, settings, await loadCatalog(rows));
  const summary = summarize(plan);
  await sequelize.transaction(async (t) => {
    await Usuario.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    const existing = await Job.findByPk(id, { transaction: t });
    if (existing) {
      if (existing.usuario_id !== userId || existing.huella !== fingerprint) throw importError("Identificador usado con otros datos.", 409);
      return;
    }
    const count = Math.ceil(plan.length / config.batchSize);
    await Job.create({ id, usuario_id: userId, archivo: String(filename).slice(0, 255), huella: fingerprint, opciones: { ...settings, mapping, version: config.version }, resumen: summary, total_lotes: count }, { transaction: t });
    for (let start = 0; start < count; start += 10) {
      await Batch.bulkCreate(Array.from({ length: Math.min(10, count - start) }, (_, i) => ({ importacion_id: id, indice: start + i, registros: plan.slice((start + i) * config.batchSize, (start + i + 1) * config.batchSize) })), { transaction: t });
    }
  });
  return getImport(id, userId);
}
export async function getImport(id, userId) {
  const job = await ownedJob(id, userId);
  const batches = await Batch.findAll({ where: { importacion_id: id }, attributes: ["indice", "registros"], order: [["indice", "ASC"]], limit: 1 });
  return { ...job.toJSON(), sample: batches.flatMap((b) => b.registros.slice(0, 20).map(publicRow)) };
}
export async function listImports(userId) {
  return Job.findAll({ where: { usuario_id: userId }, attributes: ["id", "archivo", "estado", "resumen", "resultado", "siguiente_lote", "total_lotes", "creado_en"], order: [["creado_en", "DESC"]], limit: 20 });
}
export async function executeBatch(id, userId, { index, confirm = false, skipErrors = false } = {}) {
  if (!Number.isInteger(index) || index < 0) throw importError("Lote inválido.");
  await sequelize.transaction(async (t) => {
    // Un solo lote por importación; dos pestañas o un reintento no repiten escrituras.
    const job = await ownedJob(id, userId, t, true);
    if (index < job.siguiente_lote || job.estado === "completado") return;
    if (job.estado === "cancelado") throw importError("La importación fue cancelada.", 409);
    if (index !== job.siguiente_lote) throw importError("Actualizá el progreso antes de continuar.", 409);
    if (job.opciones.version !== config.version) throw importError("Cambió el formato del importador. Validá nuevamente el archivo.", 409);
    if (job.estado === "validado" && (confirm !== true || job.resumen.error > 0 && skipErrors !== true)) throw importError("Confirmá la carga y la exclusión de filas inválidas.", 409);
    const batch = await Batch.findOne({ where: { importacion_id: id, indice: index }, transaction: t, lock: t.LOCK.UPDATE });
    if (!batch) throw importError("No existe ese lote.", 404);
    // Locks breves por lote: evita duplicados incluso si otro operador edita
    // el catálogo por los CRUD existentes (que no usan el lock de importación).
    for (const table of ["categoria_distribuidora", "producto_distribuidora", "variedad_distribuidora"]) await sequelize.query('LOCK TABLE "' + DB_SCHEMA + '"."' + table + '" IN SHARE ROW EXCLUSIVE MODE', { transaction: t });
    const catalog = await loadCatalog(batch.registros, t);
    const refreshed = buildPlan(batch.registros, job.opciones, catalog);
    const actual = batch.registros.map((original, i) => {
      if (["error", "skip"].includes(original.action)) return original;
      const current = refreshed[i];
      if (original.action !== current.action || original.target !== current.target || original.before !== current.before || original.productBefore && original.productBefore !== current.productBefore) {
        return { ...original, action: "error", message: "El catálogo cambió desde la validación. No se modificó esta fila; revisala y volvé a importarla." };
      }
      return current;
    });
    const added = await applyPlan(actual, catalog, t);
    const partial = summarize(actual), result = { ...job.resultado };
    for (const [key, count] of Object.entries(partial)) result[key] = (result[key] || 0) + count;
    result.products = (result.products || 0) + added.products;
    result.categories = (result.categories || 0) + added.categories;
    await batch.update({ registros: actual, procesado: true }, { transaction: t });
    await job.update({ resultado: result, siguiente_lote: index + 1, estado: index + 1 === job.total_lotes ? "completado" : "procesando", actualizado_en: new Date() }, { transaction: t });
  });
  return getImport(id, userId);
}
export async function cancelImport(id, userId) {
  await sequelize.transaction(async (t) => {
    const job = await ownedJob(id, userId, t, true);
    if (job.estado !== "completado") await job.update({ estado: "cancelado", actualizado_en: new Date() }, { transaction: t });
  });
  return getImport(id, userId);
}
// Generador por lote: no materializa un segundo catálogo completo para descargarlo.
export async function* importReport(id, userId) {
  const job = await ownedJob(id, userId);
  const escape = (value) => {
    let s = String(value ?? "");
    if (/^\s*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  yield "\uFEFF" + ["Fila", "SKU", "Producto", "Acción", "Detalle", "Estado del lote"].map(escape).join(";") + "\r\n";
  for (let start = 0; start < job.total_lotes; start += 10) {
    const batches = await Batch.findAll({ where: { importacion_id: id, indice: { [Op.gte]: start, [Op.lt]: start + 10 } }, order: [["indice", "ASC"]] });
    for (const batch of batches) for (const r of batch.registros) yield [r.row, r.value?.cod_ref, r.value?.producto_nombre, r.action, r.message, batch.procesado ? "Procesado" : "Sin ejecutar"].map(escape).join(";") + "\r\n";
  }
}
