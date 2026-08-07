import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Visita de seguimiento kinesiológico — solo la fecha. El contenido de la
 * visita (qué días le tocan y qué observación queda) vive en
 * RecordatorioKinesiologia (1 sesión : N recordatorios), no acá, para no
 * repetir el error de la tabla vieja de mezclar todo en una sola fila.
 */
export const SesionKinesiologia = sequelize.define("SesionKinesiologia", {
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

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "sesion_kinesiologia",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["ficha_id"] },
    { fields: ["fecha"] },
  ],
});
