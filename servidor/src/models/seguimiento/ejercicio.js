import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Catálogo de ejercicios disponibles para registrar avances.
 * Compartido entre entrenamiento personalizado y kinesiología —
 * tipo_ejercicio_id distingue el contexto de uso.
 */
export const Ejercicio = defineModel("Ejercicio", {
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },

  tipo_ejercicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tipo_ejercicio", key: "id" },
  },
  grupo_muscular_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "grupo_muscular", key: "id" },
  },

  activo:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "ejercicio",
  indexes: [
    { fields: ["tipo_ejercicio_id"] },
    { fields: ["grupo_muscular_id"] },
    { fields: ["activo"] },
  ],
});
