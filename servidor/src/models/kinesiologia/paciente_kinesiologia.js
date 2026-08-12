import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Extiende persona con datos específicos del rol paciente de kinesiología.
 * Relación 1:1 con persona (persona_id UNIQUE) — independiente de alumno,
 * una persona puede ser paciente de kinesiología sin tener membresía de gym.
 */
export const PacienteKinesiologia = defineModel("PacienteKinesiologia", {
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "persona", key: "id" },
  },

  // Patologías: ver tabla puente paciente_patologia (N:N con catálogo patologia)
  observaciones_medicas:   { type: DataTypes.TEXT, allowNull: true },
  fecha_inicio_tratamiento: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  // Estado general del paciente (no el de una patología puntual — ver
  // FichaKinesiologica.estado para eso). Se puede volver atrás en cualquier
  // momento, ej. reingresa a tratamiento tras haber quedado "recuperado".
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "en_tratamiento",
    validate: { isIn: [["en_tratamiento", "finalizado", "recuperado"]] },
  },

  creado_en:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // NULL = activo. Fecha = baja definitiva del tratamiento.
  eliminado_en:   { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "paciente_kinesiologia",
  indexes: [
    { fields: ["persona_id"] },
    { fields: ["estado"] },
  ],
});
