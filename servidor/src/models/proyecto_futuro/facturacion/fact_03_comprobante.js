import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

export const Fact03Comprobante = sequelize.define(
  "Fact03Comprobante",
  {
    ID_FACT03: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK → ORD_03_ORDEN
    RELA_ORD03: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // un comprobante por orden
    },

    // FK → FACT_01_TIPO_COMP
    RELA_FACT01: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // FK → FACT_02_PUNTO_VENTA
    RELA_FACT02: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // número correlativo dentro del punto de venta
    FACT03_NUMERO: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // "0001-00000001"
    FACT03_NUMERO_FORMATEADO: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // CUIT del receptor: "20-12345678-9"
    FACT03_CUIT_RECEPTOR: {
      type: DataTypes.STRING(13),
      allowNull: true,
    },

    // URL al PDF generado (S3, etc.)
    FACT03_PDF_URL: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    FACT03_FECHA: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "FACT_03_COMPROBANTE",
    indexes: [
      {
        unique: true,
        fields: ["RELA_FACT02", "RELA_FACT01", "FACT03_NUMERO"],
        name: "uq_comprobante_pv_tipo_numero",
      },
    ],
  }
);
