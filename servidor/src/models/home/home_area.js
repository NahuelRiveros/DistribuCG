import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/** Catálogo de áreas del home (Gym, Kinesiología, General). */
export const HomeArea = sequelize.define("HomeArea", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "home_area",
  schema:     DB_SCHEMA,
  timestamps: false,
});
