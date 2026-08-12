import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/** Catálogo de géneros (Masculino, Femenino, Otro). */
export const Sexo = defineModel("Sexo", {
  descripcion: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "sexo",
});
