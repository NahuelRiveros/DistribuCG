import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Sesión (visita) de seguimiento kinesiológico: el checklist de progresión
 * se completa una sola vez por visita. Los ejercicios trabajados ese día
 * viven aparte, en SesionKinesiologicaEjercicio (1 sesión : N ejercicios).
 *
 * Reemplaza a RegistroSesionKinesiologia (que duplicaba el checklist por
 * cada ejercicio) — esa tabla vieja no se toca, queda como histórico ya
 * volcado acá vía migrado_desde_id.
 *
 * "Dolor ≤3/10" y "RIR≥2" (criterios del papel) no se guardan como columnas
 * propias: se derivan de dolor_durante y rir al armar el checklist, para no
 * duplicar datos que puedan desincronizarse.
 *
 * dolor_24h es la única excepción al patrón "inmutable" de registro_ejercicio:
 * se pregunta recién en la sesión siguiente, referido a esta, así que queda
 * nullable y se actualiza (UPDATE) cuando el paciente vuelve.
 */
export const SesionKinesiologica = sequelize.define("SesionKinesiologica", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  ficha_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ficha_kinesiologica", key: "id" },
    onDelete: "CASCADE",
  },
  registrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  fecha: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },

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

  // Solo para la migración desde registro_sesion_kinesiologia — idempotencia
  // del script de migración (seed.js). No se usa en el flujo normal.
  migrado_desde_id: { type: DataTypes.INTEGER, allowNull: true, unique: true },

  creado_en:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName:  "sesion_kinesiologica",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["ficha_id"] },
    { fields: ["fecha"] },
  ],
});
