import { proyecto } from "compartido/proyecto.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../nucleo/errores.js";
import { eliminarImagenGuardada, subirImagen } from "../../nucleo/imagenes.js";
import { Producto, ProductoImagen } from "./modelos.js";

const ATRIBUTOS = ["id", "producto_id", "url", "alt", "orden"];

async function productoConLugar(producto_id, transaction) {
  const producto = await Producto.findOne({ where: { id: producto_id, eliminado_en: null }, attributes: ["id", "nombre"], transaction });
  if (!producto) throw new NoEncontrado("El producto no existe.", "PRODUCTO_NO_ENCONTRADO");
  const cantidad = await ProductoImagen.count({ where: { producto_id }, transaction });
  const maximo = proyecto.catalogo.max_imagenes_producto;
  if (cantidad >= maximo) throw new Conflicto(`El producto ya tiene ${maximo} imágenes (el máximo).`, "LIMITE_IMAGENES");
  const orden = (await ProductoImagen.max("orden", { where: { producto_id }, transaction })) ?? -1;
  return { producto, orden: orden + 1 };
}

function plano(imagen) {
  const { id, producto_id, url, alt, orden } = imagen.get({ plain: true });
  return { id, producto_id, url, alt, orden };
}

/** Sube el archivo al almacén y lo registra al final de la galería del producto. */
export async function agregarImagenArchivo(producto_id, archivo, { alt = null } = {}) {
  if (!archivo) throw new DatosInvalidos("Elegí una imagen para subir.");
  const { producto } = await productoConLugar(producto_id);
  const subida = await subirImagen(archivo.buffer, { carpeta: "productos" });
  try {
    return await sequelize.transaction(async (transaction) => {
      const { orden } = await productoConLugar(producto_id, transaction);
      return plano(await ProductoImagen.create({ producto_id, url: subida.url, public_id: subida.public_id, alt: alt ?? producto.nombre, orden }, { transaction }));
    });
  } catch (error) {
    // No dejar la imagen huérfana en el almacén si no se pudo registrar.
    await eliminarImagenGuardada(subida.public_id);
    throw error;
  }
}

/** Imagen alojada en otro lado (https). Útil si no hay almacén configurado. */
export async function agregarImagenUrl(producto_id, { url, alt }) {
  return sequelize.transaction(async (transaction) => {
    const { producto, orden } = await productoConLugar(producto_id, transaction);
    return plano(await ProductoImagen.create({ producto_id, url, alt: alt ?? producto.nombre, orden }, { transaction }));
  });
}

export async function eliminarImagen(producto_id, imagen_id) {
  const imagen = await ProductoImagen.findOne({ where: { id: imagen_id, producto_id } });
  if (!imagen) throw new NoEncontrado("La imagen no existe.", "IMAGEN_NO_ENCONTRADA");
  await imagen.destroy();
  await eliminarImagenGuardada(imagen.public_id);
}

/** `ids` en el orden deseado; la primera es la imagen principal. Tienen que estar todas. */
export async function ordenarImagenes(producto_id, ids) {
  return sequelize.transaction(async (transaction) => {
    const actuales = await ProductoImagen.findAll({ where: { producto_id }, attributes: ["id"], transaction, lock: transaction.LOCK.UPDATE });
    const mismas = actuales.length === ids.length && new Set(ids).size === ids.length && actuales.every((a) => ids.includes(a.id));
    if (!mismas) throw new DatosInvalidos("El orden tiene que incluir todas las imágenes del producto, una sola vez.");
    for (const [orden, id] of ids.entries()) {
      await ProductoImagen.update({ orden }, { where: { id, producto_id }, transaction });
    }
    const ordenadas = await ProductoImagen.findAll({ where: { producto_id }, attributes: ATRIBUTOS, order: [["orden", "ASC"]], transaction });
    return ordenadas.map(plano);
  });
}
