import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";
export const ImportacionCatalogo = defineModel("ImportacionCatalogo", {
  id: { type: DataTypes.UUID, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "usuario", key: "id" } },
  archivo: { type: DataTypes.STRING(255), allowNull: false },
  huella: { type: DataTypes.STRING(64), allowNull: false },
  opciones: { type: DataTypes.JSONB, allowNull: false },
  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "validado" },
  resumen: { type: DataTypes.JSONB, allowNull: false },
  resultado: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  siguiente_lote: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  total_lotes: { type: DataTypes.INTEGER, allowNull: false },
  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: "importacion_catalogo", indexes: [{ fields: ["usuario_id", "creado_en"] }] });
export const ImportacionCatalogoLote = defineModel("ImportacionCatalogoLote", {
  importacion_id: { type: DataTypes.UUID, allowNull: false, references: { model: "importacion_catalogo", key: "id" } },
  indice: { type: DataTypes.INTEGER, allowNull: false },
  registros: { type: DataTypes.JSONB, allowNull: false },
  procesado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "importacion_catalogo_lote", indexes: [{ unique: true, fields: ["importacion_id", "indice"] }] });
