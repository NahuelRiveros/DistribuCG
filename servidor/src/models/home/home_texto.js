import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../database/sequelize.js";

/**
 * Textos editables del home (hero, títulos de sección, CTA final, etc.) —
 * un valor por `clave`, no es una lista. `seccion` agrupa el formulario del
 * panel admin (hero, pilares, galeria, contacto, footer_cta).
 */
export const HomeTexto = sequelize.define("HomeTexto", {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clave:     { type: DataTypes.STRING(60), allowNull: false, unique: true },
  etiqueta:  { type: DataTypes.STRING(150), allowNull: false },
  seccion:   { type: DataTypes.STRING(30), allowNull: false },
  valor:     { type: DataTypes.TEXT, allowNull: true },
  orden:     { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },

  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "home_texto",
  schema:     DB_SCHEMA,
  timestamps: false,
  indexes: [
    { fields: ["seccion"] },
  ],
});
