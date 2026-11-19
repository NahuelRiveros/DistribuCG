// Mantenimiento del catálogo para el super admin (CAT-52 a CAT-58): limpiar todos los artículos y volver a
// cargar el catálogo del cliente (seed/catalogo_cliente.json) con sus fotos, oculto hasta que la lista le ponga precio.
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../../core/database/sequelize.js";
import * as modelos from "../models/index.js";
import { ImportacionCatalogo as Trabajo } from "../models/index.js";
import { buildPlan } from "./importacion/plan.js";
import { loadCatalog, applyPlan } from "./importacion/catalog_repository.js";
import { importError } from "./importacion/normalize.js";
import { leerImagenesCatalogo, asignarImagenesCatalogo } from "../seed/imagenes_catalogo.js";

export const FRASE_LIMPIAR = "BORRAR ARTÍCULOS";
export const ARCHIVO_CATALOGO = new URL("../seed/catalogo_cliente.json", import.meta.url);
const TIPO_CARGA = "carga_catalogo", TIPO_LIMPIEZA = "limpieza_catalogo";
const LOTE = 250;
const tabla = (nombre) => `"${DB_SCHEMA}"."${nombre}"`;
const AJUSTES = { identity: "sku", mode: "create", updateFields: ["precio"], priceType: "net", defaultVat: 21 };

/** El archivo se genera fuera del panel (organizar_catalogo_cliente.mjs): se valida fila por fila antes de usarlo. */
export async function leerCatalogoCliente(archivo = ARCHIVO_CATALOGO) {
  let texto;
  try { texto = await readFile(archivo, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return { filas: [], huella: null }; throw error; }
  const datos = JSON.parse(texto);
  if (!Array.isArray(datos)) throw importError("catalogo_cliente.json tiene que ser una lista.", 500);
  const texto80 = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const filas = datos.filter((f) => f && /^\d{6}$/.test(f.codigo) && texto80(f.nombre, 150) && texto80(f.categoria, 170)
    && f.categoria.split(" > ").length === 2 && (f.presentacion == null || texto80(f.presentacion, 100)) && (!f.marca || texto80(f.marca, 80))
    && Number.isInteger(f.bulto) && f.bulto >= 1 && f.bulto <= 10000);
  if (filas.length !== datos.length) throw importError(`catalogo_cliente.json tiene ${datos.length - filas.length} filas inválidas: generalo de nuevo.`, 500);
  return { filas, huella: createHash("sha256").update(texto).digest("hex") };
}

const contar = async (sql, transaction) => Number((await sequelize.query(sql, { type: QueryTypes.SELECT, transaction }))[0].n);

async function cargaEnCurso(transaction, bloquear = false) {
  const [fila] = await sequelize.query(`
    SELECT id FROM ${tabla("importacion_catalogo")} WHERE opciones->>'tipo' = :tipo AND estado = 'procesando'
    ORDER BY creado_en DESC LIMIT 1`, { replacements: { tipo: TIPO_CARGA }, type: QueryTypes.SELECT, transaction });
  return fila ? Trabajo.findByPk(fila.id, { transaction, ...(bloquear ? { lock: transaction.LOCK.UPDATE } : {}) }) : null;
}

/** CAT-53 y CAT-55: qué hay hoy y si se puede cargar. */
export async function estadoCatalogo({ archivo } = {}) {
  const [articulos, presentaciones, categorias, marcas, carritos, preciosRegionales, renglonesPedidos] = await Promise.all([
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("producto_distribuidora")}`),
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("variedad_distribuidora")}`),
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("categoria_distribuidora")}`),
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("marca_distribuidora")}`),
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("carrito_distribuidora_item")}`),
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("lista_precio_item")}`),
    contar(`SELECT COUNT(*)::int AS n FROM ${tabla("nota_pedido_item")} WHERE producto_id IS NOT NULL OR variedad_id IS NOT NULL`),
  ]);
  const { filas } = await leerCatalogoCliente(archivo);
  const fotos = await leerImagenesCatalogo();
  const carga = await cargaEnCurso();
  return {
    articulos, presentaciones, categorias, marcas, carritos, preciosRegionales, renglonesPedidos,
    catalogo: { articulos: filas.length, conFoto: filas.filter((f) => fotos[f.codigo]).length },
    carga: carga ? { id: carga.id, siguiente_lote: carga.siguiente_lote, total_lotes: carga.total_lotes } : null,
    puedeCargar: filas.length > 0 && (articulos === 0 || Boolean(carga)),
  };
}

/** CAT-53: copia de lo que hay, para tener registro antes de limpiar. */
export async function copiaCatalogo() {
  return sequelize.query(`
    SELECT v.cod_ref AS codigo, p.nombre AS articulo, v.nombre AS presentacion, cp.nombre AS familia, c.nombre AS categoria,
           p.marca, v.precio, v.precio_anterior, v.unidades_por_bulto AS bulto, p.activo, p.imagen_url AS foto
    FROM ${tabla("variedad_distribuidora")} v
    JOIN ${tabla("producto_distribuidora")} p ON p.id = v.producto_id
    LEFT JOIN ${tabla("categoria_distribuidora")} c ON c.id = p.categoria_id
    LEFT JOIN ${tabla("categoria_distribuidora")} cp ON cp.id = c.padre_id
    ORDER BY v.cod_ref NULLS LAST, p.nombre`, { type: QueryTypes.SELECT });
}

/**
 * CAT-54: borra artículos, presentaciones, categorías y marcas en una sola transacción. Los pedidos conservan
 * su copia (nombre, presentación, precio, IVA) y dejan de apuntar al artículo. Las fotos de Cloudinary no se tocan.
 */
export async function limpiarCatalogo(usuarioId, confirmacion) {
  if (confirmacion !== FRASE_LIMPIAR) throw importError(`Para confirmar escribí exactamente: ${FRASE_LIMPIAR}`);
  return sequelize.transaction(async (t) => {
    // Nadie compra, importa ni edita el catálogo mientras se borra.
    for (const nombre of ["carrito_distribuidora_item", "lista_precio_item", "variedad_distribuidora", "producto_distribuidora", "marca_categoria_distribuidora", "marca_distribuidora", "categoria_distribuidora"]) {
      await sequelize.query(`LOCK TABLE ${tabla(nombre)} IN ACCESS EXCLUSIVE MODE`, { transaction: t });
    }
    const borrar = async (nombre) => (await sequelize.query(`DELETE FROM ${tabla(nombre)}`, { transaction: t }))[1].rowCount;
    const [, desvinculados] = await sequelize.query(
      `UPDATE ${tabla("nota_pedido_item")} SET producto_id = NULL, variedad_id = NULL WHERE producto_id IS NOT NULL OR variedad_id IS NOT NULL`,
      { transaction: t });
    const resultado = {
      renglones_pedidos: desvinculados.rowCount,
      carritos: await borrar("carrito_distribuidora_item"),
      precios_regionales: await borrar("lista_precio_item"),
      presentaciones: await borrar("variedad_distribuidora"),
      articulos: await borrar("producto_distribuidora"),
      marcas_por_categoria: await borrar("marca_categoria_distribuidora"),
      marcas: await borrar("marca_distribuidora"),
      categorias: await borrar("categoria_distribuidora"),
    };
    // Una carga que había quedado a medias ya no tiene sentido.
    await sequelize.query(`
      UPDATE ${tabla("importacion_catalogo")} SET estado = 'cancelado', actualizado_en = NOW()
      WHERE opciones->>'tipo' = :tipo AND estado = 'procesando'`, { replacements: { tipo: TIPO_CARGA }, transaction: t });
    // CAT-58: queda registrado quién limpió y qué se borró.
    await Trabajo.create({
      id: randomUUID(), usuario_id: usuarioId, archivo: "limpieza del catálogo", huella: "-", estado: "completado",
      opciones: { tipo: TIPO_LIMPIEZA }, resumen: resultado, resultado, total_lotes: 0,
    }, { transaction: t });
    return resultado;
  });
}

const fila = (f, i) => ({
  row: i + 1,
  value: {
    cod_ref: f.codigo, producto_nombre: f.nombre, variedad_nombre: f.presentacion ?? null, categoria: f.categoria, marca: f.marca || null,
    descripcion: null, importe: 0, iva_porcentaje: null, cantidad: null, codigo_barras: null, unidades_por_bulto: f.bulto,
  },
});

/**
 * CAT-55 y CAT-56: carga un lote del catálogo del cliente. El primero solo con la base sin artículos; los
 * siguientes continúan la misma carga (sirve para reanudar si se corta). Todo entra oculto en $0 (CAT-43).
 */
// `archivo` solo cambia en los tests: el panel siempre carga seed/catalogo_cliente.json.
export async function cargarLote(usuarioId, indice, { archivo } = {}) {
  if (!Number.isInteger(indice) || indice < 0) throw importError("Lote inválido.");
  const { filas, huella } = await leerCatalogoCliente(archivo);
  if (!filas.length) throw importError("No está el catálogo del cliente en el sistema (seed/catalogo_cliente.json).", 409);
  const total = Math.ceil(filas.length / LOTE);
  return sequelize.transaction(async (t) => {
    // Mismo bloqueo que el seed y las fotos: dos cargas no se cruzan.
    await sequelize.query("SELECT pg_advisory_xact_lock(741923, 1)", { transaction: t });
    let carga = await cargaEnCurso(t, true);
    if (!carga) {
      if (indice !== 0) throw importError("No hay una carga en curso: empezá de nuevo.", 409);
      if (await contar(`SELECT COUNT(*)::int AS n FROM ${tabla("producto_distribuidora")}`, t)) {
        throw importError("Ya hay artículos cargados. Para cargar el catálogo de nuevo, primero limpialo.", 409);
      }
      carga = await Trabajo.create({
        id: randomUUID(), usuario_id: usuarioId, archivo: "catalogo_cliente.json", huella, estado: "procesando",
        opciones: { tipo: TIPO_CARGA }, resumen: { total: filas.length }, resultado: {}, total_lotes: total,
      }, { transaction: t });
    }
    if (carga.huella !== huella) throw importError("El catálogo cambió durante la carga. Limpiá y empezá de nuevo.", 409);
    // Un reintento del mismo lote no repite nada.
    if (indice < carga.siguiente_lote) return vistaCarga(carga);
    if (indice !== carga.siguiente_lote) throw importError("Actualizá el progreso antes de continuar.", 409);

    const lote = filas.slice(indice * LOTE, (indice + 1) * LOTE).map((f, i) => fila(f, indice * LOTE + i));
    const catalogo = await loadCatalog(lote, t);
    const plan = buildPlan(lote, AJUSTES, catalogo);
    const creados = await applyPlan(plan, catalogo, t);
    const resultado = { ...carga.resultado };
    const sumar = (clave, n) => { resultado[clave] = (resultado[clave] ?? 0) + n; };
    sumar("presentaciones", plan.filter((p) => p.action === "create").length);
    sumar("articulos", creados.products);
    sumar("categorias", creados.categories);
    const errores = plan.filter((p) => p.action === "error");
    sumar("errores", errores.length);
    resultado.detalle_errores = [...(resultado.detalle_errores ?? []), ...errores.map((p) => ({ codigo: p.value?.cod_ref, mensaje: p.message }))].slice(0, 100);
    const ultimo = indice + 1 === carga.total_lotes;
    if (ultimo) sumar("fotos", (await asignarImagenesCatalogo(modelos, await leerImagenesCatalogo(), t)).asignadas);
    await carga.update({ resultado, siguiente_lote: indice + 1, estado: ultimo ? "completado" : "procesando", actualizado_en: new Date() }, { transaction: t });
    return vistaCarga(carga);
  });
}

const vistaCarga = (carga) => ({ id: carga.id, estado: carga.estado, siguiente_lote: carga.siguiente_lote, total_lotes: carga.total_lotes, resultado: carga.resultado });
