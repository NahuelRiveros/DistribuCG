import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";
export const OperacionCarrito = defineModel("OperacionCarrito", {
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "usuario", key: "id" } },
  clave: { type: DataTypes.STRING(100), allowNull: false },
  huella: { type: DataTypes.STRING(64), allowNull: false },
  respuesta: { type: DataTypes.JSONB, allowNull: false },
}, { tableName: "operacion_carrito", indexes: [{ unique: true, fields: ["usuario_id", "clave"] }] });
