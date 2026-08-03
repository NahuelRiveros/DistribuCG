import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Reemplaza el array CONTACTS hardcodeado (dirección, Instagram, etc.) de
 * home_page.jsx. `icono` validado contra el mismo mapa fijo que HomePilar.
 */
export const HomeContacto = sequelize.define("HomeContacto", {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  icono:  { type: DataTypes.STRING(40), allowNull: false },
  label:  { type: DataTypes.STRING(80), allowNull: false },
  valor:  { type: DataTypes.STRING(255), allowNull: false },
  href:   { type: DataTypes.STRING(500), allowNull: true },
  orden:  { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "home_contacto",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["activo"] },
    { fields: ["orden"] },
  ],
});
