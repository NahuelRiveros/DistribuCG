import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

const DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

/**
 * Qué ejercicios se trackean para una ficha y cómo se agrupan por día —
 * es el "plan" que después la matriz cruza contra las sesiones reales
 * (SesionKinesiologicaEjercicio). No es una tabla de datos clínicos: no
 * tiene historial propio, guardar la rutina reemplaza la lista completa.
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

  // Agrupamiento visual de la fila en la matriz — null = grupo "Otros".
  // STRING validado en vez de ENUM de Postgres: un ENUM es frágil de
  // alterar más adelante bajo sync({alter:true}), y acá es solo una
  // etiqueta de display, no una restricción de negocio.
  dia_semana: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: { isIn: [DIAS_SEMANA] },
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
