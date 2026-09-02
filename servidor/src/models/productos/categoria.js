import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Categorías de producto, jerárquicas (padre_id null = raíz).
 * Sin columna de género a propósito — es específico de indumentaria y
 * quedó fuera de esta base (ver frontend modules/eccomerce_indumentaria/catalogos/).
 */
export const Categoria = defineModel("Categoria", {
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  slug:   { type: DataTypes.STRING(80), allowNull: false },
  // null = categoría raíz
  padre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "categoria", key: "id" },
  },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "categoria",
  indexes: [
    { unique: true, fields: ["slug"], where: { fecha_baja: null }, name: "categoria_slug_activo_unique" },
    { fields: ["padre_id"] },
  ],
});
