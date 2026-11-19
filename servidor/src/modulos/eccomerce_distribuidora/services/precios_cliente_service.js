// Actualizar precios con la lista del cliente (PRE-30 a PRE-39). Reutiliza el trabajo y los lotes del
// importador (importacion_catalogo, con opciones.tipo = "precios_cliente"): misma idempotencia y bloqueos.
import { createHash } from "node:crypto";
import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../../core/database/sequelize.js";
import { Usuario, ImportacionCatalogo as Trabajo, ImportacionCatalogoLote as Lote } from "../models/index.js";
import { listaPreciosClienteConfig as config, GRUPOS_PRECIOS_CLIENTE } from "../../../../../rubros/eccomerce_distribuidora/lista_precios_cliente_config.js";
import { leerListaCliente } from "./importacion/lector_lista_cliente.js";
import { extraerPrecios, armarPlanPrecios, resumirPlan, cambioAAplicar, ESTADOS_CON_DECISION, hoyArgentina } from "./importacion/lista_cliente.js";
import { importError } from "./importacion/normalize.js";

export { hoyArgentina };
export const TIPO_PRECIOS_CLIENTE = "precios_cliente";
const tabla = (nombre) => `"${DB_SCHEMA}"."${nombre}"`;
const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const ORDEN = new Map(GRUPOS_PRECIOS_CLIENTE.map((g, i) => [g.estado, i]));
const MENSAJE_CAMBIO = "El artículo cambió desde la validación. No se tocó: revisalo y volvé a subir la lista.";

function validarId(id) {
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id || "")) throw importError("Identificador inválido.");
}

async function trabajoPropio(id, usuarioId, transaction, bloquear = false) {
  validarId(id);
  const trabajo = await Trabajo.findOne({ where: { id, usuario_id: usuarioId }, transaction, ...(bloquear ? { lock: transaction.LOCK.UPDATE } : {}) });
  if (!trabajo || trabajo.opciones?.tipo !== TIPO_PRECIOS_CLIENTE) throw importError("Actualización de precios no encontrada.", 404);
  return trabajo;
}

/** Presentaciones vigentes con código del cliente, con lo que el plan necesita de su artículo. */
async function cargarTienda(transaction) {
  const filas = await sequelize.query(`
    SELECT v.id, v.producto_id, v.cod_ref, v.precio, v.nombre, to_char(v.sin_precio_lista_desde, 'YYYY-MM-DD') AS sin_precio_lista_desde,
           p.nombre AS producto_nombre, p.marca, p.activo AS producto_activo, p.inactivo_por_lista,
           (v.fecha_baja IS NOT NULL OR p.fecha_baja IS NOT NULL) AS de_baja
    FROM ${tabla("variedad_distribuidora")} v JOIN ${tabla("producto_distribuidora")} p ON p.id = v.producto_id
    WHERE v.cod_ref IS NOT NULL`, { type: QueryTypes.SELECT, transaction });
  const delCliente = filas.filter((f) => config.codigo.test(f.cod_ref));
  return {
    variantes: delCliente.filter((f) => !f.de_baja).map((f) => ({ ...f, precio: Number(f.precio) })),
    codigosDeBaja: new Set(delCliente.filter((f) => f.de_baja).map((f) => f.cod_ref)),
  };
}

const cambiaPrecio = (fila) => ["sube", "baja", "revisar", "extremo", "reactivar", "repetido"].includes(fila.estado) && fila.precioAntes > 0;

export async function validarListaCliente(buffer, nombreArchivo, id, usuarioId) {
  validarId(id);
  const huella = createHash("sha256").update(buffer).update(config.version).digest("hex");
  const anterior = await Trabajo.findByPk(id);
  if (anterior) {
    if (anterior.usuario_id !== usuarioId || anterior.huella !== huella) throw importError("El identificador ya fue usado con otro archivo.", 409);
    return obtenerActualizacion(id, usuarioId);
  }
  const { hojas, disponibles } = await leerListaCliente(buffer, nombreArchivo);
  if (!hojas[config.hojaPrincipal]) throw importError(`El archivo no tiene la hoja ${config.hojaPrincipal}. Hojas encontradas: ${disponibles.join(", ") || "ninguna"}.`);
  const lista = extraerPrecios(hojas[config.hojaPrincipal]);
  if (!lista.length) throw importError(`La hoja ${config.hojaPrincipal} no tiene códigos de artículo. Revisá que sea la lista de precios del sistema.`);
  const comparacion = hojas[config.hojaComparacion] ? extraerPrecios(hojas[config.hojaComparacion]) : [];
  const hoy = hoyArgentina();
  const plan = armarPlanPrecios({ lista, comparacion, ...(await cargarTienda()), hoy })
    .sort((a, b) => ORDEN.get(a.estado) - ORDEN.get(b.estado) || a.cod.localeCompare(b.cod));
  const resumen = resumirPlan(plan);
  // PRE-38: cuántos precios regionales podrían ajustarse (las filas a revisar cuentan aunque falte aprobarlas).
  const conCambio = plan.filter(cambiaPrecio).map((f) => f.variedadId);
  resumen.listas_regionales = conCambio.length ? Number((await sequelize.query(
    `SELECT COUNT(*)::int AS n FROM ${tabla("lista_precio_item")} WHERE variedad_id IN (:ids)`,
    { replacements: { ids: conCambio }, type: QueryTypes.SELECT }))[0].n) : 0;
  const lotes = Math.max(1, Math.ceil(plan.length / config.batchSize));
  await sequelize.transaction(async (t) => {
    await Usuario.findByPk(usuarioId, { transaction: t, lock: t.LOCK.UPDATE });
    if (await Trabajo.findByPk(id, { transaction: t })) throw importError("El identificador ya fue usado.", 409);
    await Trabajo.create({
      id, usuario_id: usuarioId, archivo: String(nombreArchivo).slice(0, 255), huella, resumen, total_lotes: lotes,
      opciones: { tipo: TIPO_PRECIOS_CLIENTE, version: config.version, hoy, decisiones: {}, comparo: Boolean(hojas[config.hojaComparacion]) },
    }, { transaction: t });
    await Lote.bulkCreate(Array.from({ length: lotes }, (_, i) => ({
      importacion_id: id, indice: i, registros: plan.slice(i * config.batchSize, (i + 1) * config.batchSize),
    })), { transaction: t });
  });
  return obtenerActualizacion(id, usuarioId);
}

const decisionesPendientes = (trabajo) => {
  const conDecision = ["revisar", "extremo", "repetido"].reduce((n, e) => n + (trabajo.resumen[e] ?? 0), 0);
  return Math.max(0, conDecision - Object.keys(trabajo.opciones.decisiones ?? {}).length);
};

async function esLaUltima(trabajo, transaction) {
  const [ultima] = await sequelize.query(`
    SELECT id FROM ${tabla("importacion_catalogo")}
    WHERE opciones->>'tipo' = :tipo AND estado IN ('completado', 'procesando') ORDER BY creado_en DESC LIMIT 1`,
  { replacements: { tipo: TIPO_PRECIOS_CLIENTE }, type: QueryTypes.SELECT, transaction });
  return ultima?.id === trabajo.id;
}

function vistaTrabajo(trabajo, puedeDeshacer) {
  const { decisiones = {}, ajustarListas = null, hoy } = trabajo.opciones;
  return {
    id: trabajo.id, archivo: trabajo.archivo, estado: trabajo.estado, resumen: trabajo.resumen, resultado: trabajo.resultado,
    siguiente_lote: trabajo.siguiente_lote, total_lotes: trabajo.total_lotes, creado_en: trabajo.creado_en,
    fecha_lista: hoy, decididas: Object.keys(decisiones).length, pendientes: decisionesPendientes(trabajo), ajustarListas, puedeDeshacer,
  };
}

export async function obtenerActualizacion(id, usuarioId) {
  const trabajo = await trabajoPropio(id, usuarioId);
  return vistaTrabajo(trabajo, trabajo.estado === "completado" && await esLaUltima(trabajo));
}

async function todasLasFilas(id, transaction) {
  const lotes = await Lote.findAll({ where: { importacion_id: id }, order: [["indice", "ASC"]], attributes: ["indice", "registros", "procesado"], transaction });
  return lotes.flatMap((l) => l.registros);
}

const normalizar = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function listarFilas(id, usuarioId, { estado, pagina = 1, buscar = "" } = {}) {
  const trabajo = await trabajoPropio(id, usuarioId);
  if (estado && !ORDEN.has(estado)) throw importError("Grupo inválido.");
  const numero = Number(pagina);
  if (!Number.isInteger(numero) || numero < 1) throw importError("Página inválida.");
  const texto = normalizar(String(buscar).slice(0, 80).trim());
  const decisiones = trabajo.opciones.decisiones ?? {};
  const filas = (await todasLasFilas(id)).filter((f) => (!estado || f.estado === estado)
    && (!texto || f.cod.includes(texto) || normalizar(f.descripcion).includes(texto) || normalizar(f.articulo).includes(texto)));
  const desde = (numero - 1) * config.filasPorPagina;
  return {
    filas: filas.slice(desde, desde + config.filasPorPagina).map((f) => ({ ...f, decision: decisiones[f.cod] ?? null })),
    total: filas.length, pagina: numero, paginas: Math.max(1, Math.ceil(filas.length / config.filasPorPagina)),
  };
}

/** PRE-36 y PRE-37: aprobar, excluir o elegir. `aprobarTodos` aprueba solo los "A revisar", nunca los extremos. */
export async function guardarDecisiones(id, usuarioId, { decisiones = {}, aprobarTodos = false } = {}) {
  if (!decisiones || typeof decisiones !== "object" || Array.isArray(decisiones) || Object.keys(decisiones).length > 5000) throw importError("Decisiones inválidas.");
  await sequelize.transaction(async (t) => {
    const trabajo = await trabajoPropio(id, usuarioId, t, true);
    if (trabajo.estado !== "validado") throw importError("La actualización ya empezó: no se pueden cambiar las decisiones.", 409);
    const filas = new Map((await todasLasFilas(id, t)).filter((f) => ESTADOS_CON_DECISION.has(f.estado)).map((f) => [f.cod, f]));
    const actuales = { ...(trabajo.opciones.decisiones ?? {}) };
    if (aprobarTodos === true) for (const f of filas.values()) if (f.estado === "revisar") actuales[f.cod] = "aprobar";
    for (const [cod, valor] of Object.entries(decisiones)) {
      const fila = filas.get(cod);
      if (!fila) throw importError(`El código ${String(cod).slice(0, 20)} no necesita decisión.`);
      if (valor === null) { delete actuales[cod]; continue; }
      const opcion = /^opcion:(\d+)$/.exec(String(valor));
      const valida = valor === "excluir" || (fila.estado === "repetido" ? opcion && Number(opcion[1]) < fila.opciones.length : valor === "aprobar");
      if (!valida) throw importError(`Decisión inválida para el código ${cod}.`);
      actuales[cod] = valor;
    }
    await trabajo.update({ opciones: { ...trabajo.opciones, decisiones: actuales }, actualizado_en: new Date() }, { transaction: t });
  });
  return obtenerActualizacion(id, usuarioId);
}

/** (VALUES (CAST(:id0 AS int), …), …) con parámetros: las columnas las fija el código, nunca el archivo. */
function valores(filas, columnas) {
  const replacements = {};
  const sql = filas.map((fila, i) => "(" + columnas.map(([nombre, tipo]) => {
    replacements[nombre + i] = fila[nombre];
    return `CAST(:${nombre}${i} AS ${tipo})`;
  }).join(", ") + ")").join(", ");
  return { sql, replacements };
}

async function actualizarVariantes(filas, transaction) {
  if (!filas.length) return;
  const { sql, replacements } = valores(filas, [["id", "int"], ["precio", "numeric"], ["cambia", "boolean"], ["desde", "date"]]);
  await sequelize.query(`
    UPDATE ${tabla("variedad_distribuidora")} AS v
    SET precio = x.precio, sin_precio_lista_desde = x.desde,
        fecha_cambio_precio = CASE WHEN x.cambia THEN NOW() ELSE v.fecha_cambio_precio END
    FROM (VALUES ${sql}) AS x(id, precio, cambia, desde) WHERE v.id = x.id`, { replacements, transaction });
}

async function actualizarProductos(filas, transaction) {
  if (!filas.length) return;
  const { sql, replacements } = valores(filas, [["id", "int"], ["activo", "boolean"], ["ipl", "boolean"]]);
  await sequelize.query(`
    UPDATE ${tabla("producto_distribuidora")} AS p SET activo = x.activo, inactivo_por_lista = x.ipl
    FROM (VALUES ${sql}) AS x(id, activo, ipl) WHERE p.id = x.id`, { replacements, transaction });
}

async function actualizarListas(filas, transaction) {
  if (!filas.length) return;
  const { sql, replacements } = valores(filas, [["id", "int"], ["precio", "numeric"]]);
  await sequelize.query(`
    UPDATE ${tabla("lista_precio_item")} AS i SET precio = x.precio, fecha_mod = NOW()
    FROM (VALUES ${sql}) AS x(id, precio) WHERE i.id = x.id`, { replacements, transaction });
}

/** Estado actual, bloqueado, de las presentaciones y sus artículos. */
async function bloquearActuales(ids, transaction) {
  if (!ids.length) return new Map();
  const filas = await sequelize.query(`
    SELECT v.id, v.precio, to_char(v.sin_precio_lista_desde, 'YYYY-MM-DD') AS sin_precio, p.activo, p.inactivo_por_lista
    FROM ${tabla("variedad_distribuidora")} v JOIN ${tabla("producto_distribuidora")} p ON p.id = v.producto_id
    WHERE v.id IN (:ids) AND v.fecha_baja IS NULL AND p.fecha_baja IS NULL
    FOR UPDATE OF v, p`, { replacements: { ids }, type: QueryTypes.SELECT, transaction });
  return new Map(filas.map((f) => [f.id, { ...f, precio: Number(f.precio) }]));
}

export async function ejecutarLote(id, usuarioId, { index, confirm = false, ajustarListas } = {}) {
  if (!Number.isInteger(index) || index < 0) throw importError("Lote inválido.");
  await sequelize.transaction(async (t) => {
    // Un lote por vez por actualización: dos pestañas o un reintento no repiten escrituras.
    const trabajo = await trabajoPropio(id, usuarioId, t, true);
    if (index < trabajo.siguiente_lote || trabajo.estado === "completado") return;
    if (trabajo.estado === "cancelado" || trabajo.estado === "deshecho") throw importError("Esta actualización ya no se puede aplicar.", 409);
    if (index !== trabajo.siguiente_lote) throw importError("Actualizá el progreso antes de continuar.", 409);
    if (trabajo.opciones.version !== config.version) throw importError("Cambió el formato de la actualización. Volvé a subir la lista.", 409);
    let opciones = trabajo.opciones;
    if (trabajo.estado === "validado") {
      if (confirm !== true || typeof ajustarListas !== "boolean") throw importError("Confirmá la actualización y si se ajustan las listas regionales.", 409);
      opciones = { ...opciones, ajustarListas };
    }
    const lote = await Lote.findOne({ where: { importacion_id: id, indice: index }, transaction: t, lock: t.LOCK.UPDATE });
    if (!lote) throw importError("No existe ese lote.", 404);

    const decisiones = opciones.decisiones ?? {};
    const cambios = lote.registros.map((f) => cambioAAplicar(f, decisiones[f.cod], { hoy: opciones.hoy }));
    const actuales = await bloquearActuales([...new Set(cambios.filter(Boolean).map((c) => c.variedadId))], t);
    const variantes = [], productos = new Map(), resultadoFilas = [];
    for (const [i, c] of cambios.entries()) {
      if (!c) {
        const fila = lote.registros[i], decision = decisiones[fila.cod];
        const sinAplicar = ESTADOS_CON_DECISION.has(fila.estado) && (!decision || decision === "excluir");
        resultadoFilas.push(sinAplicar ? { aplicado: false, mensaje: decision === "excluir" ? "Excluida: no se tocó." : "Sin aprobar: no se tocó." } : null);
        continue;
      }
      const actual = actuales.get(c.variedadId);
      // PRE-39 y la regla del importador: si alguien lo cambió después de la vista previa, no se pisa.
      if (!actual || actual.precio !== c.precioAntes || (actual.sin_precio ?? null) !== c.sinPrecioAntes
        || actual.activo !== c.activoAntes || actual.inactivo_por_lista !== c.inactivoPorListaAntes) {
        resultadoFilas.push({ aplicado: false, mensaje: MENSAJE_CAMBIO });
        continue;
      }
      variantes.push({ id: c.variedadId, precio: c.precioNuevo, cambia: c.precioNuevo !== c.precioAntes, desde: c.sinPrecioDespues });
      if (c.accionProducto) productos.set(c.productoId, { id: c.productoId, activo: c.accionProducto === "reactivar", ipl: c.accionProducto === "desactivar" });
      resultadoFilas.push({ aplicado: true, cambio: c });
    }

    // PRE-38: las excepciones regionales siguen la misma proporción que la General.
    const listas = new Map();
    const conProporcion = resultadoFilas.filter((r) => r?.aplicado && r.cambio.precioNuevo !== r.cambio.precioAntes && r.cambio.precioAntes > 0);
    if (opciones.ajustarListas && conProporcion.length) {
      const items = await sequelize.query(
        `SELECT id, variedad_id, precio FROM ${tabla("lista_precio_item")} WHERE variedad_id IN (:ids) ORDER BY id FOR UPDATE`,
        { replacements: { ids: conProporcion.map((r) => r.cambio.variedadId) }, type: QueryTypes.SELECT, transaction: t });
      const porVariante = new Map(conProporcion.map((r) => [r.cambio.variedadId, r.cambio]));
      for (const item of items) {
        const c = porVariante.get(item.variedad_id);
        const despues = redondear(Number(item.precio) * c.precioNuevo / c.precioAntes);
        if (!listas.has(c.variedadId)) listas.set(c.variedadId, []);
        listas.get(c.variedadId).push({ id: item.id, antes: Number(item.precio), despues });
      }
    }

    await actualizarVariantes(variantes, t);
    await actualizarProductos([...productos.values()], t);
    await actualizarListas([...listas.values()].flat().map((l) => ({ id: l.id, precio: l.despues })), t);

    const registros = lote.registros.map((f, i) => {
      const r = resultadoFilas[i];
      if (!r) return f;
      return { ...f, resultado: r.aplicado ? { aplicado: true, listas: listas.get(f.variedadId) ?? [], cambio: r.cambio } : r };
    });
    const resultado = { ...trabajo.resultado };
    const sumar = (clave, n) => { if (n) resultado[clave] = (resultado[clave] ?? 0) + n; };
    const aplicadas = resultadoFilas.filter((r) => r?.aplicado);
    sumar("precios", aplicadas.filter((r) => r.cambio.precioNuevo !== r.cambio.precioAntes).length);
    sumar("desactivados", aplicadas.filter((r) => r.cambio.accionProducto === "desactivar").length);
    sumar("reactivados", aplicadas.filter((r) => r.cambio.accionProducto === "reactivar").length);
    sumar("listas_regionales", [...listas.values()].flat().length);
    sumar("cambiados", resultadoFilas.filter((r) => r?.mensaje === MENSAJE_CAMBIO).length);
    sumar("sin_aplicar", resultadoFilas.filter((r) => r && !r.aplicado && r.mensaje !== MENSAJE_CAMBIO).length);
    await lote.update({ registros, procesado: true }, { transaction: t });
    await trabajo.update({
      opciones, resultado, siguiente_lote: index + 1, actualizado_en: new Date(),
      estado: index + 1 === trabajo.total_lotes ? "completado" : "procesando",
    }, { transaction: t });
  });
  return obtenerActualizacion(id, usuarioId);
}

export async function cancelarActualizacion(id, usuarioId) {
  await sequelize.transaction(async (t) => {
    const trabajo = await trabajoPropio(id, usuarioId, t, true);
    if (trabajo.estado === "validado") await trabajo.update({ estado: "cancelado", actualizado_en: new Date() }, { transaction: t });
    else if (trabajo.estado === "procesando") throw importError("Ya se aplicó una parte: terminala y después deshacela.", 409);
  });
  return obtenerActualizacion(id, usuarioId);
}

/**
 * PRE-39: vuelve atrás la última actualización, solo donde sigue estando lo que ella puso.
 * Lo que alguien cambió después se deja como está y se informa.
 */
export async function deshacerActualizacion(id, usuarioId) {
  await sequelize.transaction(async (t) => {
    const trabajo = await trabajoPropio(id, usuarioId, t, true);
    if (trabajo.estado !== "completado") throw importError("Solo se puede deshacer una actualización terminada.", 409);
    if (!await esLaUltima(trabajo, t)) throw importError("Solo se puede deshacer la última actualización de precios.", 409);
    const lotes = await Lote.findAll({ where: { importacion_id: id }, order: [["indice", "ASC"]], transaction: t, lock: t.LOCK.UPDATE });
    const aplicadas = lotes.flatMap((l) => l.registros.filter((f) => f.resultado?.aplicado).map((f) => ({ fila: f, cambio: f.resultado.cambio })));
    const actuales = await bloquearActuales(aplicadas.map((a) => a.cambio.variedadId), t);
    const itemsIds = aplicadas.flatMap((a) => a.fila.resultado.listas.map((l) => l.id));
    const items = itemsIds.length ? new Map((await sequelize.query(
      `SELECT id, precio FROM ${tabla("lista_precio_item")} WHERE id IN (:ids) ORDER BY id FOR UPDATE`,
      { replacements: { ids: itemsIds }, type: QueryTypes.SELECT, transaction: t })).map((i) => [i.id, Number(i.precio)])) : new Map();
    const variantes = [], productos = new Map(), listas = [], noRevertidos = [];
    for (const { fila, cambio: c } of aplicadas) {
      const actual = actuales.get(c.variedadId);
      if (!actual || actual.precio !== c.precioNuevo || (actual.sin_precio ?? null) !== c.sinPrecioDespues) { noRevertidos.push(fila.cod); continue; }
      variantes.push({ id: c.variedadId, precio: c.precioAntes, cambia: c.precioNuevo !== c.precioAntes, desde: c.sinPrecioAntes });
      const puso = c.accionProducto === "desactivar" ? { activo: false, ipl: true } : c.accionProducto === "reactivar" ? { activo: true, ipl: false } : null;
      if (puso && actual.activo === puso.activo && actual.inactivo_por_lista === puso.ipl) {
        productos.set(c.productoId, { id: c.productoId, activo: c.activoAntes, ipl: c.inactivoPorListaAntes });
      }
      for (const l of fila.resultado.listas) if (items.get(l.id) === l.despues) listas.push({ id: l.id, precio: l.antes });
    }
    await actualizarVariantes(variantes, t);
    await actualizarProductos([...productos.values()], t);
    await actualizarListas(listas, t);
    await trabajo.update({
      estado: "deshecho", actualizado_en: new Date(),
      resultado: { ...trabajo.resultado, deshacer: { revertidos: variantes.length, no_revertidos: noRevertidos.length, codigos_no_revertidos: noRevertidos.slice(0, 200) } },
    }, { transaction: t });
  });
  return obtenerActualizacion(id, usuarioId);
}

export async function historialActualizaciones(usuarioId) {
  const trabajos = await sequelize.query(`
    SELECT id, archivo, estado, resumen, resultado, creado_en FROM ${tabla("importacion_catalogo")}
    WHERE usuario_id = :usuarioId AND opciones->>'tipo' = :tipo ORDER BY creado_en DESC LIMIT 20`,
  { replacements: { usuarioId, tipo: TIPO_PRECIOS_CLIENTE }, type: QueryTypes.SELECT });
  return trabajos;
}

const TITULOS = new Map(GRUPOS_PRECIOS_CLIENTE.map((g) => [g.estado, g.titulo]));
const DECISIONES = { aprobar: "Aprobada", excluir: "Excluida" };

/** Informe CSV de la actualización: una fila por código, con el antes, el después y qué pasó. */
export async function* informeActualizacion(id, usuarioId) {
  const trabajo = await trabajoPropio(id, usuarioId);
  const decisiones = trabajo.opciones.decisiones ?? {};
  const celda = (valor) => {
    let s = String(valor ?? "");
    if (/^\s*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const precio = (n) => (n == null ? "" : String(n).replace(".", ","));
  yield "﻿" + ["Código", "Descripción en la lista", "Artículo de la tienda", "Grupo", "Precio antes", "Precio de la lista", "Variación %", "Decisión", "Resultado"].map(celda).join(";") + "\r\n";
  for (const fila of await todasLasFilas(id)) {
    const decision = decisiones[fila.cod];
    const resultado = fila.resultado ? (fila.resultado.aplicado ? "Aplicado" : fila.resultado.mensaje) : "";
    yield [
      fila.cod, fila.descripcion, fila.articulo, TITULOS.get(fila.estado), precio(fila.precioAntes), precio(fila.precioLista),
      fila.variacion == null ? "" : String(fila.variacion).replace(".", ","),
      decision?.startsWith("opcion:") ? "Elegida la opción " + (Number(decision.slice(7)) + 1) : DECISIONES[decision] ?? "", resultado,
    ].map(celda).join(";") + "\r\n";
  }
}
