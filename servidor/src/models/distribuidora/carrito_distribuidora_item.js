import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

export const CarritoDistribuidoraItem = defineModel("CarritoDistribuidoraItem", {
  carrito_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "carrito_distribuidora", key: "id" },
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "producto_distribuidora", key: "id" },
  },
  // null = producto sin variedad. Ver variedad_distribuidora.js — este es el
  // `variedad_id` que usa el frontend (modules/eccomerce_distribuidora/carrito/).
  variedad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "variedad_distribuidora", key: "id" },
  },

  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  // snapshot del precio al momento de agregar
  precio_unidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  fecha_alta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "carrito_distribuidora_item",
  indexes: [
    { unique: true, fields: ["carrito_id", "producto_id", "variedad_id"], name: "uq_carrito_distribuidora_producto_variedad" },
  ],
});
