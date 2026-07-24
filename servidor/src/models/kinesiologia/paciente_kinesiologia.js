import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Extiende persona con datos específicos del rol paciente de kinesiología.
 * Relación 1:1 con persona (persona_id UNIQUE) — independiente de alumno,
 * una persona puede ser paciente de kinesiología sin tener membresía de gym.
 */
export const PacienteKinesiologia = sequelize.define("PacienteKinesiologia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "persona", key: "id" },
  },

  // Patologías: ver tabla puente paciente_patologia (N:N con catálogo patologia)
  observaciones_medicas:   { type: DataTypes.TEXT, allowNull: true },
  fecha_inicio_tratamiento: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  activo:                  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // NULL = activo. Fecha = baja definitiva del tratamiento.
  eliminado_en:   { type: DataTypes.DATE, allowNull: true },
}, {
  tableName:  "paciente_kinesiologia",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["persona_id"] },
    { fields: ["activo"] },
  ],
});
