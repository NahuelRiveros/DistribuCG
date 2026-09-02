import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Direcciones guardadas del cliente
export const Cli02Direccion = sequelize.define(
  "Cli02Direccion",
  {
    ID_CLI02: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK → CLI_01_PERFIL
    RELA_CLI01: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // etiqueta: "Casa", "Trabajo", "Otro"
    CLI02_ALIAS: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Casa",
    },

    CLI02_CALLE: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    CLI02_NUMERO: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    CLI02_PISO: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    CLI02_DEPTO: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    CLI02_CODIGO_POSTAL: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    CLI02_LOCALIDAD: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    CLI02_PROVINCIA: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    CLI02_ES_DEFAULT: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    CLI02_FECHAALTA: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    CLI02_FECHABAJA: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "CLI_02_DIRECCION",
  }
);
