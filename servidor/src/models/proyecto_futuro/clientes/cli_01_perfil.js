import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Perfil extendido del cliente (1-a-1 con AUTH_02_USUARIO)
export const Cli01Perfil = sequelize.define(
  "Cli01Perfil",
  {
    ID_CLI01: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK → AUTH_02_USUARIO (único: un perfil por usuario)
    RELA_AUTH02: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    // FK → ORD_02_CONDICION_IVA (null hasta que el usuario lo configure)
    RELA_ORD02: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    CLI01_TELEFONO: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    CLI01_DNI: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },

    // CUIT formato "XX-XXXXXXXX-X"
    CLI01_CUIT: {
      type: DataTypes.STRING(13),
      allowNull: true,
    },

    // razón social para facturación (persona jurídica o monotributista)
    CLI01_RAZON_SOCIAL: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    CLI01_FECHAALTA: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    CLI01_FECHAMOD: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "CLI_01_PERFIL",
  }
);
