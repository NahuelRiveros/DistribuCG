import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

export const Marca = defineModel("Marca", {
  nombre:      { type: DataTypes.STRING(100), allowNull: false },
  slug:        { type: DataTypes.STRING(100), allowNull: false },
  logo:        { type: DataTypes.STRING(255), allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  orden:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "marca",
  indexes: [
    { unique: true, fields: ["slug"], where: { fecha_baja: null }, name: "marca_slug_activo_unique" },
  ],
});
