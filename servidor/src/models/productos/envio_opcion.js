import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

export const EnvioOpcion = defineModel("EnvioOpcion", {
  nombre:          { type: DataTypes.STRING(100), allowNull: false },
  descripcion:     { type: DataTypes.STRING(250), allowNull: true },
  precio:          { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  // "3-5 días hábiles", "24 hs", "Retiro inmediato"
  tiempo_estimado: { type: DataTypes.STRING(60), allowNull: true },
  // monto de compra desde el cual el envío es gratis (null = nunca gratis)
  gratis_desde:    { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  activo:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  fecha_alta: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_baja: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "envio_opcion",
});
