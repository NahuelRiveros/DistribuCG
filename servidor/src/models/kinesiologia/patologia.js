import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Catálogo de patologías (Lumbalgia, Esguince de tobillo, etc.).
 * activo=false = desactivada desde el ABM — no se borra en duro porque
 * paciente_patologia referencia estas filas (pacientes ya diagnosticados
 * no deben perder el dato histórico).
 */
export const Patologia = defineModel("Patologia", {
  descripcion: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "patologia",
  indexes: [
    { fields: ["activo"] },
  ],
});
