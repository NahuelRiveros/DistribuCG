import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Una fila = una variedad comprable de un producto (ej. "Original 118g",
 * "Familiar 300g"), CON precio y stock propios — a diferencia de Stock
 * (indumentaria), donde el precio vive en el producto padre y la variante
 * solo aporta cantidad. Acá cada variedad puede costar distinto.
 * `nombre` null = producto sin variedades reales, esta fila representa "el
 * producto" (igual idea que talle_id/color_id null en Stock).
 * Es lo que el frontend llama `variedad_id` (carrito_distribuidora/,
 * nota_pedido/): el id de esta tabla.
 */
export const VariedadDistribuidora = defineModel("VariedadDistribuidora", {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "producto_distribuidora", key: "id" },
  },

  nombre: { type: DataTypes.STRING(100), allowNull: true },

  precio:          { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  // null = sin precio anterior / sin oferta
  precio_anterior: { type: DataTypes.DECIMAL(10, 2), allowNull: true },

  // false (default) = "sin stock controlado en este sistema": la cantidad
  // real vive en el sistema del cliente (no conectado a este), no se
  // bloquea ni se avisa nada acá — el negocio confirma disponibilidad real
  // al procesar la nota de pedido. true = sí se controla acá (ej. un cupo
  // reservado para el canal online) y `cantidad` pasa a ser real.
  controla_stock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  // SKU / código de barras, opcional
  cod_ref: { type: DataTypes.STRING(60), allowNull: true },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "variedad_distribuidora",
  indexes: [
    { fields: ["producto_id"] },
  ],
});
