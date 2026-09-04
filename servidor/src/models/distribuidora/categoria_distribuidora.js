import { DataTypes, Op } from "sequelize";
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
    // No puede haber dos categorías con el mismo nombre bajo el mismo padre.
    // padre_id null (raíz) necesita su PROPIO índice — en Postgres un NULL
    // nunca es "igual" a otro NULL, así que un único índice (nombre, padre_id)
    // no bloquearía dos raíces con el mismo nombre; separamos raíz de resto.
    { unique: true, fields: ["nombre", "padre_id"], where: { fecha_baja: null, padre_id: { [Op.ne]: null } }, name: "categoria_distribuidora_nombre_padre_unique" },
    { unique: true, fields: ["nombre"], where: { fecha_baja: null, padre_id: null }, name: "categoria_distribuidora_nombre_raiz_unique" },
  ],
});
