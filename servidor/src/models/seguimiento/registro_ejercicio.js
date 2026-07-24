import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Avance registrado para un ejercicio puntual de una persona (alumno o
 * paciente de kinesiología), en una fecha dada.
 * Inmutable: no se actualiza ni elimina una vez registrado.
 */
export const RegistroEjercicio = sequelize.define("RegistroEjercicio", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "persona", key: "id" },
  },
  ejercicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ejercicio", key: "id" },
  },
  registrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  fecha:         { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  peso:          { type: DataTypes.DECIMAL(6, 2), allowNull: true, validate: { min: 0 } },
  series:        { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  repeticiones:  { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  observaciones: { type: DataTypes.STRING(255), allowNull: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "registro_ejercicio",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["persona_id"] },
    { fields: ["ejercicio_id"] },
    { fields: ["fecha"] },
  ],
});
