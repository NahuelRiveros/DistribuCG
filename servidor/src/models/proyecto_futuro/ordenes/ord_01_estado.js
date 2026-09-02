import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

export const Ord01Estado = sequelize.define(
  "Ord01Estado",
  {
    ID_ORD01: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ORD01_CODIGO: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    ORD01_ETIQUETA: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ORD01_ORDEN: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ORD01_FECHAALTA: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "ORD_01_ESTADO",
  }
);
