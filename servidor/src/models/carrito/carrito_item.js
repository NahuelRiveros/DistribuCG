import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

export const CarritoItem = defineModel("CarritoItem", {
  carrito_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "carrito", key: "id" },
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "producto_tienda", key: "id" },
  },
  // null = producto sin variante. Ver stock.js — este es el `variante_id`
  // que usa el frontend (modules/eccomerce_indumentaria/carrito/).
  stock_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "stock", key: "id" },
  },

  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  // snapshot del precio al momento de agregar — para detectar cambios de
  // precio en cart_staleness.js (frontend)
  precio_unidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  fecha_alta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "carrito_item",
  indexes: [
    { unique: true, fields: ["carrito_id", "producto_id", "stock_id"], name: "uq_carrito_producto_variante" },
  ],
});
