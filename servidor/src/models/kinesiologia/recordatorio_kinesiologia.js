import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Recordatorio dentro de una sesión (visita) — qué días de la semana
 * corresponden y una observación en texto libre. Una sesión puede tener
 * varios (ej: uno para tren superior y otro para tren inferior).
 */
export const RecordatorioKinesiologia = sequelize.define("RecordatorioKinesiologia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "sesion_kinesiologia", key: "id" },
    onDelete: "CASCADE",
  },

  // Subconjunto de lunes..domingo — los días en que aplica este recordatorio.
  dias: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },

  observacion: { type: DataTypes.TEXT, allowNull: false },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "recordatorio_kinesiologia",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["sesion_id"] },
  ],
});
