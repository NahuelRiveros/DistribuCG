import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/** Catálogo de tipos de ejercicio (Fuerza, Kinesiología, Cardio, etc.). */
export const TipoEjercicio = defineModel("TipoEjercicio", {
  descripcion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "tipo_ejercicio",
});
