import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { Op } from "sequelize";
import { CategoriaDistribuidora, ProductoDistribuidora, VariedadDistribuidora } from "../../models/index.js";
import { capitalizar } from "../common/query_helpers.js";

/**
 * Parsea un .xlsx o .csv (buffer subido por multer) y devuelve la primera
 * hoja como columnas (fila 1) + filas (objeto columna→valor). Sin mapeo fijo
 * de headers — el admin elige qué columna es cada campo desde el frontend.
 */
export async function parsearArchivo(buffer, nombreArchivo) {
  const esCSV = nombreArchivo.toLowerCase().endsWith(".csv");
  const workbook = new ExcelJS.Workbook();

  if (esCSV) {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer);
  }

  const hoja = workbook.worksheets[0];
  if (!hoja) return { columnas: [], filas: [] };

  let columnas = [];
  const filas = [];

  hoja.eachRow({ includeEmpty: false }, (row, numeroFila) => {
    const valores = row.values.slice(1).map(celdaATexto);
    if (numeroFila === 1) {
      columnas = valores.map((v) => v.trim()).filter(Boolean);
      return;
    }
    const filaObj = {};
    columnas.forEach((col, i) => { filaObj[col] = (valores[i] ?? "").trim(); });
    filas.push(filaObj);
  });

  return { columnas, filas };
}

function celdaATexto(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v.text !== undefined) return String(v.text); // rich text / hyperlink
    if (v.result !== undefined) return String(v.result); // fórmula
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v);
}

function slugify(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function slugUnico(base) {
  let slug = base || "categoria";
  let sufijo = 2;
  while (await CategoriaDistribuidora.findOne({ where: { slug, fecha_baja: null } })) {
    slug = `${base}-${sufijo++}`;
  }
  return slug;
}

/**
 * Resuelve (buscando o creando) la categoría a partir de un texto que puede
 * traer jerarquía separada por ">" (ej: "Comestibles > Galletitas"). Devuelve
 * el id de la categoría más profunda de la ruta. Cachea por sesión de
 * importación para no repetir queries fila a fila.
 */
async function resolverCategoria(texto, cache) {
  const partes = texto.split(">").map((p) => p.trim()).filter(Boolean);
  if (partes.length === 0) return null;

  let padreId = null;
  let rutaKey = "";
  for (const parte of partes) {
    rutaKey += (rutaKey ? " > " : "") + parte.toLowerCase();
    if (cache.has(rutaKey)) { padreId = cache.get(rutaKey); continue; }

    let cat = await CategoriaDistribuidora.findOne({
      where: { nombre: { [Op.iLike]: parte }, padre_id: padreId, fecha_baja: null },
    });
    if (!cat) {
      const slug = await slugUnico(slugify(parte));
      cat = await CategoriaDistribuidora.create({ nombre: capitalizar(parte), slug, padre_id: padreId, fecha_alta: new Date() });
    }
    cache.set(rutaKey, cat.id);
    padreId = cat.id;
  }
  return padreId;
}

/**
 * Importa/actualiza productos+variedades a partir de filas ya parseadas
 * (columna→valor) y un mapeo { campoDestino: nombreColumna }. Un renglón =
 * una variedad; si el producto (por nombre) ya existe se reutiliza, si la
 * variedad (por cod_ref o nombre) ya existe se actualiza precio/stock/IVA.
 * No borra nada — solo crea o actualiza.
 */
export async function ejecutarImportacion(filas, mapeo) {
  const get = (fila, campo) => {
    const col = mapeo[campo];
    if (!col) return null;
    const v = fila[col];
    return v === undefined || v === null || v === "" ? null : String(v).trim();
  };

  let creados = 0, actualizados = 0;
  const errores = [];
  const categoriaCache = new Map();

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2; // +1 por el header, +1 por índice 1-based

    const nombreProducto = get(fila, "producto_nombre");
    const precioRaw = get(fila, "precio");
    if (!nombreProducto) { errores.push(`Fila ${numeroFila}: falta el nombre del producto`); continue; }
    if (!precioRaw || Number.isNaN(Number(precioRaw))) { errores.push(`Fila ${numeroFila}: precio inválido o vacío`); continue; }

    try {
      const categoriaTexto = get(fila, "categoria");
      const categoria_id = categoriaTexto ? await resolverCategoria(categoriaTexto, categoriaCache) : null;

      // Si la fila trae categoría, el match queda acotado a esa categoría
      // (mismo criterio que el constraint nombre+categoria_id del modelo) —
      // si no la trae (fila de "solo actualizar precio"), cae a buscar por
      // nombre en todo el catálogo para no forzar a repetir la categoría.
      const whereProducto = { nombre: { [Op.iLike]: nombreProducto }, fecha_baja: null };
      if (categoria_id) whereProducto.categoria_id = categoria_id;
      let producto = await ProductoDistribuidora.findOne({ where: whereProducto });

      if (!producto) {
        if (!categoria_id) { errores.push(`Fila ${numeroFila}: falta "categoría" para crear "${nombreProducto}"`); continue; }
        producto = await ProductoDistribuidora.create({
          categoria_id,
          nombre: capitalizar(nombreProducto),
          descripcion: get(fila, "descripcion"),
          marca: get(fila, "marca"),
          activo: true,
          fecha_alta: new Date(),
        });
      }

      const codRef = get(fila, "cod_ref");
      const variedadNombre = get(fila, "variedad_nombre");
      const precio = Number(precioRaw);
      const ivaRaw = get(fila, "iva_porcentaje");
      const iva_porcentaje = ivaRaw !== null && !Number.isNaN(Number(ivaRaw)) ? Number(ivaRaw) : 21;
      const cantidadRaw = get(fila, "cantidad");
      const controla_stock = cantidadRaw !== null && !Number.isNaN(Number(cantidadRaw));
      const cantidad = controla_stock ? Number(cantidadRaw) : 0;

      let variedad = codRef
        ? await VariedadDistribuidora.findOne({ where: { producto_id: producto.id, cod_ref: codRef, fecha_baja: null } })
        : null;
      if (!variedad) {
        variedad = await VariedadDistribuidora.findOne({
          where: { producto_id: producto.id, nombre: variedadNombre, fecha_baja: null },
        });
      }

      if (variedad) {
        await variedad.update({ precio, iva_porcentaje, controla_stock, cantidad, cod_ref: codRef ?? variedad.cod_ref });
        actualizados++;
      } else {
        await VariedadDistribuidora.create({
          producto_id: producto.id, nombre: variedadNombre, precio, iva_porcentaje,
          controla_stock, cantidad, cod_ref: codRef, fecha_alta: new Date(),
        });
        creados++;
      }
    } catch (error) {
      const mensaje = error.name === "SequelizeUniqueConstraintError"
        ? "ya existe un producto o categoría con ese nombre en ese nivel"
        : error.message;
      errores.push(`Fila ${numeroFila}: ${mensaje}`);
    }
  }

  return { creados, actualizados, errores };
}
