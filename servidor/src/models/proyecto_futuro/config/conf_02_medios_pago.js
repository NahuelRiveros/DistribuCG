import { DataTypes } from "sequelize";
import { sequelize }  from "../../database/sequelize.js";
import { BASE_MODEL_OPTIONS } from "../_base.js";

// Tabla de fila única — guarda los medios de pago y promociones como JSON.
// El admin puede habilitar/deshabilitar cada método y configurar cuotas sin interés.
export const Conf02MediosPago = sequelize.define(
  "Conf02MediosPago",
  {
    ID_CONF02: {
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
    tableName: "CONF_02_MEDIOS_PAGO",
  },
);
