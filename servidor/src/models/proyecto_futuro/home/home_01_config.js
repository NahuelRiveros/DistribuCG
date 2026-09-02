import { DataTypes } from "sequelize";
import { sequelize }  from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Tabla de fila única — guarda toda la configuración del home como JSON.
// Si no existe ninguna fila, el controller la crea con un objeto vacío.
export const Home01Config = sequelize.define(
  "Home01Config",
  {
    ID_HOME01: {
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
    tableName: "HOME_01_CONFIG",
  },
);
