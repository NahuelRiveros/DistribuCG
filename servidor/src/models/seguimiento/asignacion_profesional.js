import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Asignación de un profesor (entrenamiento personalizado) o kinesiólogo
 * a una persona (alumno o paciente de kinesiología).
 * Solo puede haber una asignación activa por persona Y TIPO a la vez —
 * forzado por el índice único parcial sobre (persona_id, tipo) WHERE activo = true.
 * Así una persona puede tener a la vez un profesor de gym (tipo=entrenamiento)
 * y un kinesiólogo (tipo=kinesiologia) activos, sin pisarse entre sí.
 * Al asignar uno nuevo del mismo tipo, el anterior debe cerrarse (activo=false, fecha_fin=hoy).
 */
export const AsignacionProfesional = defineModel("AsignacionProfesional", {
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "persona", key: "id" },
  },
  profesor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  tipo:         { type: DataTypes.STRING(30), allowNull: false, validate: { isIn: [["entrenamiento", "kinesiologia"]] } },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_fin:    { type: DataTypes.DATEONLY, allowNull: true },
  activo:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "asignacion_profesional",
  indexes: [
    { name: "asignacion_profesional_persona_tipo_activa_unq", unique: true, fields: ["persona_id", "tipo"], where: { activo: true } },
    { name: "asignacion_profesional_profesor_id_idx", fields: ["profesor_id"] },
    { name: "asignacion_profesional_persona_id_idx", fields: ["persona_id"] },
  ],
});
