import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/** Catálogo de categorías de producto (Bebidas, Suplementos, etc.). */
export const CategoriaProducto = sequelize.define("CategoriaProducto", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "categoria_producto",
  schema:     DB_SCHEMA,
  timestamps: false,
});
