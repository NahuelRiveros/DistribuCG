import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Reemplaza el array PILARES hardcodeado de home_page.jsx — "nuestro fuerte",
 * las tarjetas debajo del hero. `icono` es un nombre de ícono validado contra
 * un mapa fijo (ver ICONOS_HOME en home_service.js) — nunca se guarda ni
 * ejecuta código arbitrario del panel admin.
 */
export const HomePilar = sequelize.define("HomePilar", {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  icono:  { type: DataTypes.STRING(40), allowNull: false },
  titulo: { type: DataTypes.STRING(120), allowNull: false },
  texto:  { type: DataTypes.TEXT, allowNull: false },
  orden:  { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "home_pilar",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["activo"] },
    { fields: ["orden"] },
  ],
});
