import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Test funcional de la evaluación inicial de una ficha (sentadilla con barra
 * por encima de la cabeza, estocadas, sentadilla a una pierna, etc.).
 * Una fila por ejercicio evaluado.
 */
export const TestFuncional = sequelize.define("TestFuncional", {
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

  // Escala 1 (muy comprometida) a 5 (correcta) — misma escala que registro_sesion_kinesiologia
  calidad_movimiento: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  observaciones:       { type: DataTypes.TEXT, allowNull: true },
  fecha:               { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "test_funcional",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["ficha_id"] },
    { fields: ["ejercicio_id"] },
  ],
});
