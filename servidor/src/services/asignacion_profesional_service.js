import { sequelize } from "../database/sequelize.js";
import { Alumno, Usuario, UsuarioRol, Rol, Persona, AsignacionProfesional } from "../models/index.js";

const TIPO_ENTRENAMIENTO = "entrenamiento";

/** Usuarios con rol "staff" (profesores del gym), para el select de asignación. */
export async function listarProfesoresGym() {
  const rolStaff = await Rol.findOne({ where: { codigo: "staff" } });
  if (!rolStaff) return [];

  const relaciones = await UsuarioRol.findAll({
    where: { rol_id: rolStaff.id },
    include: [{
      model: Usuario,
      as: "usuario",
      required: true,
      where: { eliminado_en: null, activo: true },
      include: [{ model: Persona, as: "persona", attributes: ["nombre", "apellido"] }],
    }],
  });

  return relaciones
    .map((rel) => ({
      value: rel.usuario.id,
      label: `${rel.usuario.persona?.apellido ?? ""} ${rel.usuario.persona?.nombre ?? ""}`.trim(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Asigna (o quita, si profesor_id es null) el profesor de gym a cargo de un alumno. */
export async function asignarProfesorAlumno({ alumno_id, profesor_id }) {
  const alumno = await Alumno.findByPk(alumno_id);
  if (!alumno) return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe el alumno" };

  let profesor = null;
  if (profesor_id) {
    profesor = await Usuario.findByPk(profesor_id);
    if (!profesor) return { ok: false, codigo: "PROFESOR_INVALIDO", mensaje: "El profesor no existe" };
  }

  return await sequelize.transaction(async (t) => {
    const activa = await AsignacionProfesional.findOne({
      where: { persona_id: alumno.persona_id, tipo: TIPO_ENTRENAMIENTO, activo: true },
      transaction: t,
    });

    if (activa && profesor && activa.profesor_id === profesor.id) {
      return { ok: true, codigo: "SIN_CAMBIOS", mensaje: "El alumno ya está asignado a ese profesor" };
    }

    if (activa) {
      await activa.update(
        { activo: false, fecha_fin: sequelize.literal("CURRENT_DATE") },
        { transaction: t }
      );
    }

    if (!profesor) {
      return { ok: true, codigo: "PROFESOR_QUITADO", mensaje: "Se quitó el profesor asignado" };
    }

    await AsignacionProfesional.create(
      { persona_id: alumno.persona_id, profesor_id: profesor.id, tipo: TIPO_ENTRENAMIENTO, activo: true },
      { transaction: t }
    );

    return { ok: true, codigo: "PROFESOR_ASIGNADO", mensaje: "Profesor asignado correctamente" };
  });
}
