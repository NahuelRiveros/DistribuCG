import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/** Catálogo de categorías de producto (Bebidas, Suplementos, etc.). */
export const CategoriaProducto = defineModel("CategoriaProducto", {
  descripcion: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  activo:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "categoria_producto",
});
