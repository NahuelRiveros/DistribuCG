import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/** Catálogo de grupos musculares (Pecho, Espalda, Piernas, etc.). */
export const GrupoMuscular = sequelize.define("GrupoMuscular", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  // Agrupa el grupo muscular en una zona amplia (Tren superior / Tren
  // inferior / Core y tronco) — se usa para armar el select de ejercicios
  // agrupado en "Registrar sesión" de kinesiología.
  zona:        { type: DataTypes.STRING(40), allowNull: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "grupo_muscular",
  schema:     DB_SCHEMA,
  timestamps: false,
});
