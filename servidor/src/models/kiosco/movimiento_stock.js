import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Historial auditable de movimientos de stock de un producto.
 * tipo: "entrada" (reposición), "venta" o "baja" (rotura, vencimiento, etc.).
 * Inmutable: no se actualiza ni elimina una vez registrado.
 */
export const MovimientoStock = defineModel("MovimientoStock", {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "producto", key: "id" },
  },

  tipo:              { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [["entrada", "venta", "baja"]] } },
  motivo:            { type: DataTypes.STRING(150) },
  cantidad:          { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  precio_unitario:   { type: DataTypes.DECIMAL(10, 2) },
  metodo_pago:       { type: DataTypes.STRING(30) },

  registrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "movimiento_stock",
  indexes: [
    { fields: ["producto_id"] },
    { fields: ["tipo"] },
    { fields: ["creado_en"] },
  ],
});
