import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/** Catálogo de tipos de documento (DNI, Pasaporte, CUIL, etc.). */
export const TipoDocumento = defineModel("TipoDocumento", {
  descripcion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "tipo_documento",
});
