import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Punto de venta habilitado ante AFIP
export const Fact02PuntoVenta = sequelize.define(
  "Fact02PuntoVenta",
  {
    ID_FACT02: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // número de punto de venta AFIP: 1, 2, etc.
    FACT02_NUMERO: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    FACT02_NOMBRE: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    FACT02_ACTIVO: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    FACT02_FECHAALTA: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "FACT_02_PUNTO_VENTA",
  }
);
