import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Una fila = una "variante" (combinación talle × color, o el producto en
 * general si no tiene variantes — ahí talle_id y color_id quedan null).
 * Esto es lo que el frontend llama `variante_id` (ver
 * modules/eccomerce_indumentaria/carrito/, cart_staleness.js): el id de esta tabla, no
 * un compuesto de dos ids sueltos — así el carrito no necesita saber si el
 * negocio vende por talle, por color, por ambos o por ninguno.
 */
export const Stock = defineModel("Stock", {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "producto_tienda", key: "id" },
  },
  // null = producto sin talles
  talle_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "talle", key: "id" },
  },
  // null = producto sin variante de color
  color_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "color", key: "id" },
  },

  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "stock",
  indexes: [
    {
      unique: true,
      fields: ["producto_id", "talle_id", "color_id"],
      where: { fecha_baja: null },
      name: "uq_stock_producto_talle_color",
    },
  ],
});
