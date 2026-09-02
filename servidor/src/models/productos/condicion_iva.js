import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Catálogo de condiciones frente al IVA (AFIP: RI, CF, MT, EX, MO...).
 * Solo el catálogo de lectura — el uso real (checkout/facturación) es
 * fase 2, no está implementado todavía.
 */
export const CondicionIva = defineModel("CondicionIva", {
  codigo: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },

  fecha_alta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "condicion_iva",
});
