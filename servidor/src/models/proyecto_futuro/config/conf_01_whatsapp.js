import { DataTypes } from "sequelize";
import { sequelize }  from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Tabla de fila única — guarda la configuración de WhatsApp como JSON.
// Si no existe ninguna fila, el controller la crea con un objeto vacío.
export const Conf01Whatsapp = sequelize.define(
  "Conf01Whatsapp",
  {
    ID_CONF01: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      autoIncrement: true,
    },
    CONF_JSON: {
      type:         DataTypes.JSONB,
      allowNull:    false,
      defaultValue: {},
    },
  },
  {
    ...BASE_MODEL_OPTIONS,
    tableName: "CONF_01_WHATSAPP",
  },
);
