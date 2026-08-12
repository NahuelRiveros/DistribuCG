import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Tabla puente N:N entre paciente_kinesiologia y patologia.
 * Un paciente puede tener varias patologías simultáneas o a lo largo del tiempo.
 * activo=false = patología resuelta/dada de baja, se conserva para historial.
 */
export const PacientePatologia = defineModel("PacientePatologia", {
  paciente_kinesiologia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "paciente_kinesiologia", key: "id" },
    onDelete: "CASCADE",
  },
  patologia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "patologia", key: "id" },
    onDelete: "CASCADE",
  },

  fecha_diagnostico: { type: DataTypes.DATEONLY, allowNull: true },
  observaciones:     { type: DataTypes.STRING(255), allowNull: true },
  activo:            { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "paciente_patologia",
  indexes: [
    { unique: true, fields: ["paciente_kinesiologia_id", "patologia_id"], where: { activo: true } },
    { fields: ["paciente_kinesiologia_id"] },
    { fields: ["patologia_id"] },
  ],
});
