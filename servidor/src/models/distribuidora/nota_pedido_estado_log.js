import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";
export const NotaPedidoEstadoLog = defineModel("NotaPedidoEstadoLog", {
  nota_pedido_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "nota_pedido", key: "id" } },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "usuario", key: "id" } },
  anterior: { type: DataTypes.STRING(20), allowNull: true },
  nuevo: { type: DataTypes.STRING(20), allowNull: false },
  motivo: { type: DataTypes.STRING(500), allowNull: true },
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: "nota_pedido_estado_log", indexes: [{ fields: ["nota_pedido_id"] }] });
