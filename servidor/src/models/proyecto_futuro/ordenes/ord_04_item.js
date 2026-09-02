import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

export const Ord04Item = sequelize.define(
  "Ord04Item",
  {
    ID_ORD04: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    RELA_ORD03: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Snapshot del producto (puede haberse eliminado luego)
    RELA_PROD03: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ORD04_NOMBRE: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ORD04_CATEGORIA: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ORD04_TALLE: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ORD04_PRECIO_UNIDAD: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ORD04_CANTIDAD: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ORD04_SUBTOTAL: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "ORD_04_ITEM",
  }
);
