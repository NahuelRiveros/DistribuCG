import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Un ejercicio trabajado dentro de una SesionKinesiologica — una sesión
 * puede tener varios (tren superior, inferior, core, en cualquier
 * combinación). `orden` reconstruye el orden de carga de la visita.
 */
export const SesionKinesiologicaEjercicio = sequelize.define("SesionKinesiologicaEjercicio", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "sesion_kinesiologica", key: "id" },
    onDelete: "CASCADE",
  },
  ejercicio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "ejercicio", key: "id" },
  },

  peso:         { type: DataTypes.DECIMAL(6, 2), allowNull: true, validate: { min: 0 } },
  series:       { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  repeticiones: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  rir:          { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },

  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "sesion_kinesiologica_ejercicio",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["sesion_id"] },
    { fields: ["ejercicio_id"] },
  ],
});
