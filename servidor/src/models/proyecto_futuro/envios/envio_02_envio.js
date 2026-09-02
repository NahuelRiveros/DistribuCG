import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

export const Envio02Envio = sequelize.define(
  "Envio02Envio",
  {
    ID_ENVIO02: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK → ORD_03_ORDEN
    RELA_ORD03: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    // FK → ENVIO_01_OPCION
    RELA_ENVIO01: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // "pendiente" | "preparando" | "despachado" | "en_camino" | "entregado"
    ENVIO02_ESTADO: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pendiente",
    },

    ENVIO02_TRACKING: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    ENVIO02_CODIGO_POSTAL: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    ENVIO02_FECHA_DESPACHO: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    ENVIO02_FECHA_ENTREGA: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    ENVIO02_FECHAALTA: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "ENVIO_02_ENVIO",
  }
);
