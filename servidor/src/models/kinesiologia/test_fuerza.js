import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Test de fuerza basal de la evaluación inicial (1 a 5 RM — sentadilla,
 * hip thrust, etc.). Una fila por ejercicio evaluado.
 */
export const TestFuerza = sequelize.define("TestFuerza", {
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
  registrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  repeticiones: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  peso:         { type: DataTypes.DECIMAL(6, 2), allowNull: false, validate: { min: 0 } },
  fecha:        { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "test_fuerza",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["ficha_id"] },
    { fields: ["ejercicio_id"] },
  ],
});
