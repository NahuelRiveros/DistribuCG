import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Categorías del catálogo de distribuidora, jerárquicas (padre_id null =
 * raíz) — mismo shape que models/productos/categoria.js (indumentaria), pero
 * tabla propia: son catálogos de dos verticales distintas, no se comparten.
 */
export const CategoriaDistribuidora = defineModel("CategoriaDistribuidora", {
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  slug:   { type: DataTypes.STRING(80), allowNull: false },
  // null = categoría raíz
  padre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "categoria_distribuidora", key: "id" },
  },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "categoria_distribuidora",
  indexes: [
    { unique: true, fields: ["slug"], where: { fecha_baja: null }, name: "categoria_distribuidora_slug_activo_unique" },
    { fields: ["padre_id"] },
  ],
});
