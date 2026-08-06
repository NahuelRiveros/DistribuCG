import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Qué ejercicios se trackean para una ficha — es el "plan" que después la
 * matriz cruza contra las sesiones reales (SesionKinesiologicaEjercicio),
 * agrupando por el día de la semana real de cada sesión (no un día fijo
 * elegido acá). No es una tabla de datos clínicos: no tiene historial
 * propio, guardar la rutina reemplaza la lista completa.
 */
export const RutinaEjercicio = sequelize.define("RutinaEjercicio", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  ficha_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ficha_kinesiologica", key: "id" },
    onDelete: "CASCADE",
  },
  ejercicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ejercicio", key: "id" },
  },

  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "rutina_ejercicio",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["ficha_id"] },
    { unique: true, fields: ["ficha_id", "ejercicio_id"] },
  ],
});
