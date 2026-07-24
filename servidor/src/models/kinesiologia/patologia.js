import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/** Catálogo de patologías (Lumbalgia, Esguince de tobillo, etc.). */
export const Patologia = sequelize.define("Patologia", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "patologia",
  schema:     DB_SCHEMA,
  timestamps: false,
});
