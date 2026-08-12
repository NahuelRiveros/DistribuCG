import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Ficha de seguimiento de un episodio de tratamiento (1:1 con paciente_patologia):
 * objetivo, fecha de inicio y estado del tratamiento para ESA patología puntual.
 * El kinesiólogo a cargo no se guarda acá: sale de asignacion_profesional
 * (persona_id → profesor_id, tipo='kinesiologia') para no duplicar/desincronizar.
 */
export const FichaKinesiologica = defineModel("FichaKinesiologica", {
  paciente_patologia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "paciente_patologia", key: "id" },
  },
  creado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  objetivo:      { type: DataTypes.TEXT, allowNull: false },
  fecha_inicio:  { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  estado:        { type: DataTypes.STRING(20), allowNull: false, defaultValue: "activa", validate: { isIn: [["activa", "cerrada"]] } },
  fecha_cierre:  { type: DataTypes.DATEONLY, allowNull: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "ficha_kinesiologica",
  indexes: [
    { fields: ["paciente_patologia_id"] },
    { fields: ["estado"] },
  ],
});
