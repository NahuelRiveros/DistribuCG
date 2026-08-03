import { Patologia } from "../models/index.js";

export async function listarPatologias() {
  const items = await Patologia.findAll({ order: [["descripcion", "ASC"]] });
  return { ok: true, items };
}

export async function crearPatologia({ descripcion }) {
  const desc = String(descripcion ?? "").trim();
  if (!desc) return { ok: false, codigo: "VALIDACION", mensaje: "descripcion es obligatoria" };

  const existe = await Patologia.findOne({ where: { descripcion: desc } });
  if (existe) return { ok: false, codigo: "YA_EXISTE", mensaje: "Ya existe una patología con esa descripción" };

  const patologia = await Patologia.create({ descripcion: desc });
  return { ok: true, mensaje: "Patología creada correctamente", patologia };
}

export async function actualizarPatologia(id, { descripcion }) {
  const desc = String(descripcion ?? "").trim();
  if (!desc) return { ok: false, codigo: "VALIDACION", mensaje: "descripcion es obligatoria" };

  const patologia = await Patologia.findByPk(id);
  if (!patologia) return { ok: false, codigo: "NO_EXISTE", mensaje: "La patología no existe" };

  const otra = await Patologia.findOne({ where: { descripcion: desc } });
  if (otra && otra.id !== patologia.id)
    return { ok: false, codigo: "YA_EXISTE", mensaje: "Ya existe otra patología con esa descripción" };

  await patologia.update({ descripcion: desc });
  return { ok: true, mensaje: "Patología actualizada correctamente", patologia };
}

export async function cambiarEstadoPatologia(id, activo) {
  const patologia = await Patologia.findByPk(id);
  if (!patologia) return { ok: false, codigo: "NO_EXISTE", mensaje: "La patología no existe" };

  await patologia.update({ activo: !!activo });
  return {
    ok: true,
    mensaje: activo ? "Patología activada correctamente" : "Patología desactivada correctamente",
    patologia,
  };
}
