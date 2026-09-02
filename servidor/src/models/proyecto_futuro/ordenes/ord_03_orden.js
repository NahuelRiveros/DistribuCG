import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

export const Ord03Orden = sequelize.define(
  "Ord03Orden",
  {
    ID_ORD03: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    RELA_AUTH02: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    RELA_ORD01: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ORD03_SUBTOTAL: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ORD03_COSTO_ENVIO: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ORD03_TOTAL: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    // Snapshot de la dirección al momento del pedido (JSON)
    ORD03_DIRECCION: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    // Datos de facturación opcionales (JSON)
    ORD03_FACTURACION: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ORD03_NOTAS: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ORD03_MP_PREFERENCE_ID: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ORD03_MP_PAYMENT_ID: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ORD03_FECHAALTA: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ORD03_FECHAMOD: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "ORD_03_ORDEN",
  }
);
