import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Talle/medida — opcional. Un negocio sin variantes de tamaño simplemente
 * no carga ninguno (ver stock.js: talle_id es nullable).
 */
export const Talle = defineModel("Talle", {
  nombre: { type: DataTypes.STRING(10), allowNull: false },
  orden:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "talle",
  indexes: [
    { unique: true, fields: ["nombre"], where: { fecha_baja: null }, name: "talle_nombre_activo_unique" },
  ],
});
