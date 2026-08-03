import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Registro de una sesión de seguimiento kinesiológico: carga de trabajo +
 * indicadores de progresión + criterios para subir carga.
 *
 * "Dolor ≤3/10" y "RIR≥2" (criterios del papel) no se guardan como columnas
 * propias: se derivan de dolor_durante y rir al armar el checklist, para no
 * duplicar datos que puedan desincronizarse.
 *
 * dolor_24h es la única excepción al patrón "inmutable" de registro_ejercicio:
 * se pregunta recién en la sesión siguiente, referido a esta, así que queda
 * nullable y se actualiza (UPDATE) cuando el paciente vuelve.
 */
export const RegistroSesionKinesiologia = sequelize.define("RegistroSesionKinesiologia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  ficha_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ficha_kinesiologica", key: "id" },
    onDelete: "CASCADE",
  },
  ejercicio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "ejercicio", key: "id" },
  },
  registrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  fecha:        { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  peso:         { type: DataTypes.DECIMAL(6, 2), allowNull: true, validate: { min: 0 } },
  series:       { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  repeticiones: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
  rir:          { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },

  dolor_durante: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 10 } },
  dolor_24h:     { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 10 } },

  // Escala 1 (peor) a 5 (mejor) — pensada para graficar tendencia en Estadísticas
  calidad_movimiento:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  tolerancia_carga:    { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  confianza_paciente:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  cumplimiento_programa: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },

  tecnica_correcta:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sin_compensaciones:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  buena_recuperacion:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  apto_para_subir_carga: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  observaciones: { type: DataTypes.TEXT, allowNull: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "registro_sesion_kinesiologia",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["ficha_id"] },
    { fields: ["fecha"] },
  ],
});
