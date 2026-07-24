import { Readable } from "stream";
import { cloudinary } from "../configuracion_servidor/cloudinary.js";
import { HomeArea, HomeContenido } from "../models/index.js";

function subirBufferACloudinary(buffer, { resourceType, area }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `kinetica/home/${area}`, resource_type: resourceType },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function listarAreas() {
  return HomeArea.findAll({ order: [["id", "ASC"]] });
}

export async function obtenerContenidoPublico() {
  const areas = await HomeArea.findAll({
    include: [{
      model: HomeContenido,
      as: "contenidos",
      where: { activo: true },
      required: false,
      attributes: ["id", "tipo_media", "titulo", "descripcion", "cloudinary_url", "orden"],
    }],
    order: [["id", "ASC"], [{ model: HomeContenido, as: "contenidos" }, "orden", "ASC"]],
  });

  return areas.map((area) => ({
    id: area.id,
    descripcion: area.descripcion,
    contenidos: area.contenidos,
  }));
}

export async function listarContenidoAdmin({ area_id } = {}) {
  const where = area_id ? { area_id } : {};
  return HomeContenido.findAll({
    where,
    include: [{ model: HomeArea, as: "area", attributes: ["id", "descripcion"] }],
    order: [["area_id", "ASC"], ["orden", "ASC"]],
  });
}

export async function crearContenido({ area_id, titulo, descripcion, orden, buffer, mimetype }) {
  if (!area_id) return { ok: false, codigo: "VALIDACION", mensaje: "area_id es obligatorio" };
  if (!buffer) return { ok: false, codigo: "VALIDACION", mensaje: "Falta el archivo a subir" };

  const area = await HomeArea.findByPk(area_id);
  if (!area) return { ok: false, codigo: "AREA_NO_EXISTE", mensaje: "El área indicada no existe" };

  const esVideo = String(mimetype ?? "").startsWith("video/");
  const esImagen = String(mimetype ?? "").startsWith("image/");
  if (!esVideo && !esImagen) {
    return { ok: false, codigo: "VALIDACION", mensaje: "El archivo debe ser una imagen o un video" };
  }

  const subida = await subirBufferACloudinary(buffer, {
    resourceType: esVideo ? "video" : "image",
    area: area.descripcion.toLowerCase().replace(/\s+/g, "-"),
  });

  const contenido = await HomeContenido.create({
    area_id,
    tipo_media: esVideo ? "video" : "imagen",
    titulo: titulo || null,
    descripcion: descripcion || null,
    orden: Number.isFinite(Number(orden)) ? Number(orden) : 0,
    cloudinary_url: subida.secure_url,
    cloudinary_public_id: subida.public_id,
  });

  return { ok: true, mensaje: "Contenido subido correctamente", data: contenido };
}

export async function actualizarContenido(id, { titulo, descripcion, orden, activo }) {
  const contenido = await HomeContenido.findByPk(id);
  if (!contenido) return null;

  const updates = { actualizado_en: new Date() };
  if (titulo !== undefined) updates.titulo = titulo || null;
  if (descripcion !== undefined) updates.descripcion = descripcion || null;
  if (orden !== undefined) updates.orden = Number(orden) || 0;
  if (activo !== undefined) updates.activo = Boolean(activo);

  await contenido.update(updates);
  return contenido;
}

export async function cambiarEstadoContenido(id, activo) {
  const contenido = await HomeContenido.findByPk(id);
  if (!contenido) return null;
  await contenido.update({ activo, actualizado_en: new Date() });
  return contenido;
}

export async function eliminarContenido(id) {
  const contenido = await HomeContenido.findByPk(id);
  if (!contenido) return null;

  await cloudinary.uploader.destroy(contenido.cloudinary_public_id, {
    resource_type: contenido.tipo_media === "video" ? "video" : "image",
  });
  await contenido.destroy();
  return true;
}
