import { readFile } from "node:fs/promises";

/**
 * Fotos del catálogo del cliente ya subidas a Cloudinary: imagenes_catalogo.json guarda
 * código interno (cod_ref) → URL. Lo genera `npm run imagenes:subir` desde la PC que tiene
 * las fotos; acá solo se leen, así el servidor de producción no necesita esos archivos.
 */
export const ARCHIVO_IMAGENES = new URL("./imagenes_catalogo.json", import.meta.url);

// Solo URLs de Cloudinary: el archivo se edita fuera del panel y no debe colar enlaces ajenos.
const urlValida = (url) => {
  if (typeof url !== "string" || url.length > 500) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" && !u.username && !u.password;
  } catch {
    return false;
  }
};

export async function leerImagenesCatalogo(archivo = ARCHIVO_IMAGENES) {
  let datos;
  try {
    datos = JSON.parse(await readFile(archivo, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`imagenes_catalogo.json no es un JSON válido: ${error.message}`);
  }
  return Object.fromEntries(Object.entries(datos ?? {}).filter(([codigo, url]) => codigo.trim() && urlValida(url)));
}

/**
 * Cuenta de Cloudinary + public_id de una URL, sin transformaciones ni versión: dos URLs con la misma
 * clave son la misma foto, aunque se haya vuelto a subir (cambia la versión).
 */
export function recursoCloudinary(url) {
  try {
    const [cuenta, , entrega, ...resto] = new URL(url).pathname.split("/").filter(Boolean);
    if (entrega !== "upload") return null;
    const partes = resto.filter((p) => !p.includes(",") && !/^[a-z]{1,2}_/.test(p) && !/^v\d+$/.test(p));
    return partes.length ? `${cuenta}/${partes.join("/").replace(/\.[a-z0-9]+$/i, "")}` : null;
  } catch {
    return null;
  }
}

/**
 * Pone la foto a los artículos vigentes por el código interno de sus presentaciones. Solo escribe si el
 * artículo no tiene foto o si tiene ESA MISMA foto del catálogo con otra dirección (se volvió a subir y la
 * vieja ya no existe). Nunca reemplaza otra foto (cargada a mano desde la ficha).
 * Si un artículo tiene varios códigos con foto, usa la del código más bajo, el mismo
 * criterio con el que se nombraron al subirlas.
 */
export async function asignarImagenesCatalogo(modelos, imagenes, transaction) {
  const { ProductoDistribuidora, VariedadDistribuidora } = modelos;
  const codigos = Object.keys(imagenes);
  if (!codigos.length) return { asignadas: 0 };
  const variedades = await VariedadDistribuidora.findAll({
    where: { cod_ref: codigos, fecha_baja: null }, attributes: ["producto_id", "cod_ref"], raw: true, transaction,
  });
  if (!variedades.length) return { asignadas: 0 };
  const productos = await ProductoDistribuidora.findAll({
    where: { id: [...new Set(variedades.map((v) => v.producto_id))], fecha_baja: null },
    attributes: ["id", "imagen_url"], raw: true, transaction,
  });
  const actual = new Map(productos.map((p) => [p.id, p.imagen_url]));
  const fotoDe = new Map();
  for (const v of [...variedades].sort((a, b) => a.cod_ref.localeCompare(b.cod_ref))) {
    if (!actual.has(v.producto_id) || fotoDe.has(v.producto_id)) continue;
    const nueva = imagenes[v.cod_ref], hoy = actual.get(v.producto_id);
    const reemplazable = !hoy || (hoy !== nueva && recursoCloudinary(hoy) === recursoCloudinary(nueva));
    fotoDe.set(v.producto_id, reemplazable ? nueva : null);
  }
  let asignadas = 0;
  for (const [id, url] of fotoDe) {
    if (!url) continue;
    // Con la foto que se leyó recién: si alguien la cambió a mano en el medio, no se pisa.
    const [n] = await ProductoDistribuidora.update({ imagen_url: url }, { where: { id, imagen_url: actual.get(id) }, transaction });
    asignadas += n;
  }
  return { asignadas };
}

/** Arranque con IMAGENES_CATALOGO_AL_INICIAR=true. Sin fotos pendientes no escribe nada. */
export async function seed_imagenes_catalogo() {
  const imagenes = await leerImagenesCatalogo();
  if (!Object.keys(imagenes).length) return null;
  const { sequelize } = await import("../../../core/database/sequelize.js");
  const modelos = await import("../models/index.js");
  const resultado = await sequelize.transaction(async (transaction) => {
    // Mismo bloqueo que las cargas del catálogo: no se cruza con una importación del seed.
    await sequelize.query("SELECT pg_advisory_xact_lock(741923, 1)", { transaction });
    return asignarImagenesCatalogo(modelos, imagenes, transaction);
  });
  if (resultado.asignadas) console.log(`✅ Fotos del catálogo: ${resultado.asignadas} artículos recibieron su foto`);
  return resultado;
}
