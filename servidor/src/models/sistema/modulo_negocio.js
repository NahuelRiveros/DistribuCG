import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Módulos de negocio que se venden por separado (Gym, Kinesiología). Distinto
 * de `Modulo` (usuarios/modulo.js), que es el catálogo de secciones del panel
 * de permisos — acá `habilitado` es un gate real de licencia por instalación,
 * consultado por requireModuloHabilitado() incluso para admin.
 */
export const ModuloNegocio = sequelize.define("ModuloNegocio", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo:      { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(150), allowNull: false },
  habilitado:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "modulo_negocio",
  schema:     DB_SCHEMA,
  timestamps: false,
});
