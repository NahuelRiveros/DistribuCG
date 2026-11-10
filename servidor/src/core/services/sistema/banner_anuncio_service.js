import { BannerAnuncio } from "../../models/index.js";
import { crearCrudService } from "../common/crud_service.js";

const MAX_ANUNCIOS = 4;

const crud = crearCrudService(BannerAnuncio, { defaultOrder: [["orden", "ASC"], ["id", "ASC"]] });

/** Público — lo consume la cinta de anuncios en toda la app, sin login. */
export async function listarBannerPublico() {
  return BannerAnuncio.findAll({
    where: { activo: true },
    attributes: ["id", "texto"],
    order: [["orden", "ASC"], ["id", "ASC"]],
  });
}

export async function listarBannerAdmin() {
  const { items } = await crud.listar();
  return items;
}

export async function crearBannerAnuncio({ texto, orden }) {
  if (!texto?.trim()) return { ok: false, codigo: "VALIDACION", mensaje: "El texto es obligatorio" };

  const total = await BannerAnuncio.count();
  if (total >= MAX_ANUNCIOS) {
    return { ok: false, codigo: "TOPE_ALCANZADO", mensaje: `La cinta admite hasta ${MAX_ANUNCIOS} anuncios. Editá o eliminá uno existente.` };
  }

  const anuncio = await BannerAnuncio.create({
    texto: texto.trim(),
    orden: Number.isFinite(Number(orden)) ? Number(orden) : total,
  });
  return { ok: true, mensaje: "Anuncio creado correctamente", data: anuncio };
}

export async function actualizarBannerAnuncio(id, { texto, orden }) {
  const anuncio = await BannerAnuncio.findByPk(id);
  if (!anuncio) return { ok: false, codigo: "NO_EXISTE", mensaje: "El anuncio no existe" };
  if (texto !== undefined && !texto.trim()) return { ok: false, codigo: "VALIDACION", mensaje: "El texto es obligatorio" };

  const updates = {};
  if (texto !== undefined) updates.texto = texto.trim();
  if (orden !== undefined) updates.orden = Number(orden) || 0;

  await anuncio.update(updates);
  return { ok: true, mensaje: "Anuncio actualizado correctamente", data: anuncio };
}

export async function cambiarEstadoBannerAnuncio(id, activo) {
  const anuncio = await crud.cambiarEstado(id, activo);
  if (!anuncio) return { ok: false, codigo: "NO_EXISTE", mensaje: "El anuncio no existe" };
  return { ok: true, mensaje: activo ? "Anuncio activado correctamente" : "Anuncio desactivado correctamente", data: anuncio };
}

export async function eliminarBannerAnuncio(id) {
  const eliminado = await crud.eliminar(id);
  if (!eliminado) return { ok: false, codigo: "NO_EXISTE", mensaje: "El anuncio no existe" };
  return { ok: true, mensaje: "Anuncio eliminado correctamente" };
}
