import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

export const Color = defineModel("Color", {
  nombre: { type: DataTypes.STRING(50), allowNull: false },
  hex:    { type: DataTypes.STRING(7), allowNull: true },
  orden:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "color",
});
