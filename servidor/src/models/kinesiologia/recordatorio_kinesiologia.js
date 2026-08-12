import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Recordatorio dentro de una sesión (visita) — qué días de la semana
 * corresponden y una observación en texto libre. Una sesión puede tener
 * varios (ej: uno para tren superior y otro para tren inferior).
 */
export const RecordatorioKinesiologia = defineModel("RecordatorioKinesiologia", {
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
  tableName: "recordatorio_kinesiologia",
  indexes: [
    { fields: ["sesion_id"] },
  ],
});
