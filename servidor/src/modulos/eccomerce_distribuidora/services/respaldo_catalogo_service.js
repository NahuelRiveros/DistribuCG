// Respaldo del catálogo (CAT-65 a CAT-67): planilla con cada presentación vigente (código, artículo, precios, bulto,
// categoría, marca y foto) y el índice de fotos con el formato de `npm run imagenes:subir`, para restaurarlas.
// Solo lee: lo usan el botón del panel (planilla) y el comando `catalogo:respaldo` (planilla + fotos).
import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../../core/database/sequelize.js";

const tabla = (nombre) => `"${DB_SCHEMA}"."${nombre}"`;

// [clave de la fila, encabezado de la planilla]
export const COLUMNAS_RESPALDO = [
  ["codigo", "Código"], ["articulo", "Artículo"], ["presentacion", "Presentación"], ["familia", "Familia"],
  ["categoria", "Categoría"], ["marca", "Marca"], ["precio", "Precio"], ["precio_anterior", "Precio anterior"],
  ["iva", "IVA %"], ["unidad", "Unidad"], ["bulto", "Unidades por bulto"], ["unidad_bulto", "Envase del bulto"],
  ["codigo_barras", "Código de barras"], ["a_la_venta", "A la venta"], ["descripcion", "Descripción"],
  ["foto", "Foto"], ["articulo_id", "ID artículo"],
];
// PRE-70: datos internos; solo van en el respaldo de quien tiene "Cambiar precios" (y en el comando de la PC).
const COLUMNAS_COSTO = [["costo_neto", "Costo neto"], ["rentabilidad", "Rentabilidad %"]];
export const columnasRespaldo = (conCostos) => (conCostos ? [...COLUMNAS_RESPALDO.slice(0, 8), ...COLUMNAS_COSTO, ...COLUMNAS_RESPALDO.slice(8)] : COLUMNAS_RESPALDO);

export async function filasRespaldo() {
  return sequelize.query(`
    SELECT v.cod_ref AS codigo, p.nombre AS articulo, v.nombre AS presentacion, f.nombre AS familia, c.nombre AS categoria,
           p.marca, v.precio, v.precio_anterior, v.iva_porcentaje AS iva, v.unidad_medida AS unidad,
           v.unidades_por_bulto AS bulto, v.unidad_bulto, v.codigo_barras, p.activo, p.descripcion,
           p.imagen_url AS foto, p.id AS articulo_id, v.costo_neto, v.rentabilidad
    FROM ${tabla("variedad_distribuidora")} v
    JOIN ${tabla("producto_distribuidora")} p ON p.id = v.producto_id AND p.fecha_baja IS NULL
    LEFT JOIN ${tabla("categoria_distribuidora")} c ON c.id = p.categoria_id
    LEFT JOIN ${tabla("categoria_distribuidora")} f ON f.id = c.padre_id
    WHERE v.fecha_baja IS NULL
    ORDER BY v.cod_ref NULLS LAST, p.nombre, v.id`, { type: QueryTypes.SELECT });
}

// Excel en español: coma decimal; un texto que empieza con = + - @ no se ejecuta como fórmula.
const numero = (v) => (v == null || v === "" ? "" : String(Number(v)).replace(".", ","));
const celda = (v) => {
  let s = String(v ?? "");
  if (/^\s*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
const NUMERICAS = new Set(["precio", "precio_anterior", "iva", "costo_neto", "rentabilidad"]);

/** CAT-65: CSV para Excel (UTF-8 con BOM, separado por punto y coma). */
export function armarCsvRespaldo(filas, { conCostos = false } = {}) {
  const columnas = columnasRespaldo(conCostos);
  const valor = (f, clave) => {
    if (clave === "a_la_venta") return f.activo && Number(f.precio) > 0 ? "sí" : "no";
    return NUMERICAS.has(clave) ? numero(f[clave]) : f[clave];
  };
  return "﻿" + [
    columnas.map(([, titulo]) => celda(titulo)).join(";"),
    ...filas.map((f) => columnas.map(([clave]) => celda(valor(f, clave))).join(";")),
  ].join("\r\n");
}

/**
 * CAT-67: una entrada por foto (los artículos que comparten foto van juntos), nombrada con el código más bajo del
 * artículo: el mismo criterio con que `imagenes:subir` arma el public_id y el arranque la vuelve a asignar.
 */
export function indiceFotosRespaldo(filas) {
  const porFoto = new Map();
  for (const f of filas) {
    if (!f.foto || !f.codigo) continue;
    if (!porFoto.has(f.foto)) porFoto.set(f.foto, { producto: f.articulo, categoria: [f.familia, f.categoria].filter(Boolean).join(" > "), codigos: new Set() });
    porFoto.get(f.foto).codigos.add(String(f.codigo));
  }
  return [...porFoto].map(([foto, e]) => {
    const codigos = [...e.codigos].sort((a, b) => a.localeCompare(b));
    return { archivo: `${codigos[0]}.jpg`, producto: e.producto, marca: true, categoria: e.categoria, codigos, imagen_origen: foto };
  }).sort((a, b) => a.archivo.localeCompare(b.archivo));
}

/** La foto guardada en Cloudinary sin achicar: saca las transformaciones de entrega y pide JPG. */
export function urlOriginal(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== "res.cloudinary.com") return url;
    const partes = u.pathname.split("/");
    const i = partes.indexOf("upload");
    if (i < 0) return url;
    const resto = partes.slice(i + 1);
    // Las transformaciones van primero ("c_limit,w_600", "f_auto"); después vienen la versión y el public_id.
    while (resto.length > 1 && (resto[0].includes(",") || /^[a-z]{1,2}_/.test(resto[0]))) resto.shift();
    return `${u.origin}${[...partes.slice(0, i + 1), "f_jpg", ...resto].join("/")}`;
  } catch {
    return url;
  }
}
