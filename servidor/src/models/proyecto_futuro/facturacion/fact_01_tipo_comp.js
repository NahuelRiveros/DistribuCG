import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Tipos de comprobante AFIP: A, B, C
export const Fact01TipoComp = sequelize.define(
  "Fact01TipoComp",
  {
    ID_FACT01: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // "A" | "B" | "C"
    FACT01_LETRA: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      unique: true,
    },

    FACT01_NOMBRE: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    // qué condición IVA del receptor corresponde
    FACT01_CONDICION_RECEPTOR: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    FACT01_FECHAALTA: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "FACT_01_TIPO_COMP",
  }
);
