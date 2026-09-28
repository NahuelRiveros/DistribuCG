import { Op } from "sequelize";
import ExcelJS from "exceljs";
import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";
import { sequelize, DB_SCHEMA } from "../../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../../nucleo/errores.js";
import { Usuario } from "../../usuarios/modelos.js";
import { ImportacionCatalogo, ImportacionCatalogoLote } from "../modelos.js";
import { leerArchivo } from "./leer_archivo.js";
import { normalizarFilas, validarOpciones } from "./normalizar.js";
import { armarPlan, hash, resumir } from "./plan.js";
import { aplicarPlan, cargarCatalogo } from "./repositorio.js";

// Adaptado de DistribuCG (services/distribuidora/importacion_distribuidora_service.js).
// Flujo: previsualizar → validar (guarda el plan en lotes, sin tocar el catálogo)
//        → ejecutar lote por lote → informe. Cada usuario ve solo sus importaciones.

const UUID = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const ESTADOS_FINALES = ["completado", "cancelado"];

const filaPublica = (f) => ({
  fila: f.fila,
  sku: f.valor?.sku ?? "",
  producto: f.valor?.producto ?? "",
  presentacion: f.valor?.presentacion ?? "",
  accion: f.accion,
  mensaje: f.mensaje ?? "",
  precio_anterior: f.precio_anterior ?? null,
  precio_final: f.precio_final ?? null,
  stock: f.valor?.stock ?? null,
});

function validarId(id) {
  if (!UUID.test(id ?? "")) throw new DatosInvalidos("Identificador de importación inválido.");
}

async function importacionPropia(id, usuario_id, { transaction, bloquear = false } = {}) {
  validarId(id);
  const importacion = await ImportacionCatalogo.findOne({
    where: { id, usuario_id },
    transaction,
    ...(bloquear ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!importacion) throw new NoEncontrado("La importación no existe.", "IMPORTACION_NO_ENCONTRADA");
  return importacion;
}

export async function previsualizar(buffer, nombreArchivo, opciones) {
  const leido = await leerArchivo(buffer, nombreArchivo, opciones);
  return { ...leido, filas: leido.filas.slice(0, config.filasMuestra), total: leido.filas.length };
}

/** Lee todo el archivo, arma el plan y lo guarda en lotes. No modifica el catálogo. */
export async function validar({ buffer, nombreArchivo, mapeo, opciones, id, usuario_id }) {
  validarId(id);
  const huella = hash([hash(buffer.toString("base64")), mapeo, opciones, config.version]);
  const previa = await ImportacionCatalogo.findOne({ where: { id, usuario_id } });
  if (previa) {
    // Reintento de la misma validación (ej. doble click): se devuelve la ya guardada.
    if (previa.huella !== huella) throw new Conflicto("Ese identificador ya se usó con otro archivo u opciones.", "IMPORTACION_DUPLICADA");
    return obtener(id, usuario_id);
  }

  const leido = await leerArchivo(buffer, nombreArchivo, opciones);
  if (!leido.filas.length) throw new DatosInvalidos("El archivo no tiene productos debajo del encabezado.");
  const completas = validarOpciones(mapeo, opciones, leido.columnas);
  const filas = normalizarFilas(leido, mapeo, completas);
  const plan = armarPlan(filas, completas, await cargarCatalogo(filas));

  await sequelize.transaction(async (transaction) => {
    // Bloquea al usuario: dos validaciones simultáneas con el mismo id no chocan.
    await Usuario.findByPk(usuario_id, { transaction, lock: transaction.LOCK.UPDATE });
    const existente = await ImportacionCatalogo.findByPk(id, { transaction });
    if (existente) {
      if (existente.usuario_id !== usuario_id || existente.huella !== huella) throw new Conflicto("Ese identificador ya se usó con otros datos.", "IMPORTACION_DUPLICADA");
      return;
    }
    const total_lotes = Math.ceil(plan.length / config.tamanoLote);
    await ImportacionCatalogo.create(
      {
        id,
        usuario_id,
        archivo: String(nombreArchivo).slice(0, 255),
        huella,
        opciones: { ...completas, mapeo, version: config.version },
        resumen: resumir(plan),
        total_lotes,
      },
      { transaction },
    );
    const lotes = Array.from({ length: total_lotes }, (_, indice) => ({
      importacion_id: id,
      indice,
      registros: plan.slice(indice * config.tamanoLote, (indice + 1) * config.tamanoLote),
    }));
    for (let i = 0; i < lotes.length; i += 10) await ImportacionCatalogoLote.bulkCreate(lotes.slice(i, i + 10), { transaction });
  });
  return obtener(id, usuario_id);
}

export async function obtener(id, usuario_id) {
  const importacion = await importacionPropia(id, usuario_id);
  const primerLote = await ImportacionCatalogoLote.findOne({ where: { importacion_id: id, indice: 0 }, attributes: ["registros"] });
  return { ...importacion.get({ plain: true }), muestra: (primerLote?.registros ?? []).slice(0, 20).map(filaPublica) };
}

export async function historial(usuario_id) {
  const lista = await ImportacionCatalogo.findAll({
    where: { usuario_id },
    attributes: ["id", "archivo", "estado", "resumen", "resultado", "siguiente_lote", "total_lotes", "creado_en"],
    order: [["creado_en", "DESC"]],
    limit: 20,
  });
  return lista.map((i) => i.get({ plain: true }));
}

/**
 * Ejecuta UN lote. Si el lote ya se procesó (reintento, otra pestaña), no hace nada:
 * así nunca se duplican productos. Antes de escribir vuelve a armar el plan y, si
 * el catálogo cambió desde la validación, esa fila no se toca y queda informada.
 */
export async function ejecutarLote(id, usuario_id, { indice, confirmar = false, omitir_errores = false }) {
  if (!Number.isInteger(indice) || indice < 0) throw new DatosInvalidos("Lote inválido.");
  await sequelize.transaction(async (transaction) => {
    const importacion = await importacionPropia(id, usuario_id, { transaction, bloquear: true });
    if (indice < importacion.siguiente_lote || importacion.estado === "completado") return;
    if (importacion.estado === "cancelado") throw new Conflicto("La importación fue cancelada.", "IMPORTACION_CANCELADA");
    if (indice !== importacion.siguiente_lote) throw new Conflicto("Actualizá el progreso antes de continuar.", "LOTE_FUERA_DE_ORDEN");
    if (importacion.opciones.version !== config.version) throw new Conflicto("Cambió el formato del importador. Validá el archivo de nuevo.", "VERSION_DISTINTA");
    if (importacion.estado === "validado" && (confirmar !== true || (importacion.resumen.error > 0 && omitir_errores !== true))) {
      throw new Conflicto("Confirmá la carga y que se omitan las filas con errores.", "FALTA_CONFIRMAR");
    }
    const lote = await ImportacionCatalogoLote.findOne({ where: { importacion_id: id, indice }, transaction, lock: transaction.LOCK.UPDATE });
    if (!lote) throw new NoEncontrado("No existe ese lote.", "LOTE_NO_ENCONTRADO");

    // Bloqueo breve de las tablas del catálogo: nadie crea duplicados mientras se aplica el lote.
    await sequelize.query(`LOCK TABLE ${DB_SCHEMA}.categoria, ${DB_SCHEMA}.producto, ${DB_SCHEMA}.variante, ${DB_SCHEMA}.stock IN SHARE ROW EXCLUSIVE MODE`, { transaction });
    const catalogo = await cargarCatalogo(lote.registros, transaction);
    const actualizado = armarPlan(lote.registros, importacion.opciones, catalogo);
    const definitivo = lote.registros.map((original, i) => {
      if (["error", "omitir"].includes(original.accion)) return original;
      const actual = actualizado[i];
      const cambio =
        original.accion !== actual.accion ||
        original.destino !== actual.destino ||
        original.antes !== actual.antes ||
        (original.producto_antes && original.producto_antes !== actual.producto_antes);
      return cambio ? { ...original, accion: "error", mensaje: "El catálogo cambió desde la validación. Esta fila no se modificó; revisala y volvé a importarla." } : actual;
    });

    const agregados = await aplicarPlan(definitivo, catalogo, transaction, { usuario_id, importacion_id: id });
    const resultado = { ...importacion.resultado };
    for (const [clave, cantidad] of Object.entries(resumir(definitivo))) resultado[clave] = (resultado[clave] ?? 0) + cantidad;
    resultado.productos_nuevos = (resultado.productos_nuevos ?? 0) + agregados.productos;
    resultado.categorias_nuevas = (resultado.categorias_nuevas ?? 0) + agregados.categorias;

    await lote.update({ registros: definitivo, procesado: true }, { transaction });
    await importacion.update(
      { resultado, siguiente_lote: indice + 1, estado: indice + 1 === importacion.total_lotes ? "completado" : "procesando" },
      { transaction },
    );
  });
  return obtener(id, usuario_id);
}

export async function cancelar(id, usuario_id) {
  await sequelize.transaction(async (transaction) => {
    const importacion = await importacionPropia(id, usuario_id, { transaction, bloquear: true });
    if (!ESTADOS_FINALES.includes(importacion.estado)) await importacion.update({ estado: "cancelado" }, { transaction });
  });
  return obtener(id, usuario_id);
}

/** Informe CSV de todas las filas, generado de a 10 lotes para no cargar todo en memoria. */
export async function* informe(id, usuario_id) {
  const importacion = await importacionPropia(id, usuario_id);
  const escapar = (valor) => {
    let s = String(valor ?? "");
    if (/^\s*[=+@-]/.test(s)) s = `'${s}`; // evita que Excel ejecute fórmulas (CSV injection)
    return `"${s.replaceAll('"', '""')}"`;
  };
  const ACCIONES = { crear: "Crear", actualizar: "Actualizar", sin_cambios: "Sin cambios", omitir: "Omitir", error: "Error" };
  yield "\uFEFF" + ["Fila", "Código", "Producto", "Presentación", "Acción", "Detalle", "Estado del lote"].map(escapar).join(";") + "\r\n";
  for (let desde = 0; desde < importacion.total_lotes; desde += 10) {
    const lotes = await ImportacionCatalogoLote.findAll({
      where: { importacion_id: id, indice: { [Op.gte]: desde, [Op.lt]: desde + 10 } },
      order: [["indice", "ASC"]],
    });
    for (const lote of lotes) {
      for (const r of lote.registros) {
        yield [r.fila, r.valor?.sku, r.valor?.producto, r.valor?.presentacion, ACCIONES[r.accion], r.mensaje, lote.procesado ? "Procesado" : "Sin ejecutar"].map(escapar).join(";") + "\r\n";
      }
    }
  }
}

/** Excel de ejemplo con las columnas que el asistente reconoce solo. */
export async function escribirPlantilla(destino) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Productos");
  hoja.columns = [
    { header: "SKU", key: "sku", width: 18, style: { numFmt: "@" } },
    { header: "Producto", key: "producto", width: 32 },
    { header: "Presentación", key: "presentacion", width: 22 },
    { header: "Categoría", key: "categoria", width: 30 },
    { header: "Precio", key: "precio", width: 14 },
    { header: "IVA", key: "iva", width: 10 },
    { header: "Marca", key: "marca", width: 20 },
  ];
  hoja.addRow({ sku: "000123", producto: "Arroz de ejemplo", presentacion: "Paquete 1 kg", categoria: "Almacén > Arroz", precio: 1000, iva: 21, marca: "Marca de ejemplo" });
  hoja.getRow(1).font = { bold: true };
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  const ayuda = libro.addWorksheet("Instrucciones");
  ayuda.getColumn(1).width = 110;
  [
    "Reemplazá la fila de ejemplo por tus productos antes de importar.",
    "Una fila por presentación. Escribí el SKU como texto para conservar los ceros iniciales.",
    "El precio del ejemplo es NETO (sin IVA): 1000 + 21 % = 1210 en la tienda. Si tu lista ya incluye IVA, indicalo en el asistente.",
    "Las categorías pueden tener niveles: Almacén > Arroz. Las que no existan se crean solas.",
    "En el asistente podés elegir la hoja, la fila de títulos y qué columna corresponde a cada dato.",
  ].forEach((texto) => ayuda.addRow([texto]));
  await libro.xlsx.write(destino);
}
