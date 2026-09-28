import { DataTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "./sequelize.js";

const PK_AUTOINCREMENTAL = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true };

/**
 * sequelize.define() con los defaults del proyecto (traído de DistribuCG):
 * mismo schema, tabla con el nombre exacto, id autoincremental, y
 * creado_en / actualizado_en automáticos. La tabla la crea una migración,
 * nunca sync(): el modelo tiene que coincidir con la migración.
 */
export function defineModel(nombre, atributos, opciones = {}) {
  // Si el modelo ya declara su clave primaria (ej. configuracion.clave), no se agrega `id`.
  const tienePk = Object.values(atributos).some((a) => a?.primaryKey);
  const attrs = tienePk ? atributos : { id: PK_AUTOINCREMENTAL, ...atributos };

  return sequelize.define(nombre, attrs, {
    schema: DB_SCHEMA,
    freezeTableName: true,
    underscored: true,
    timestamps: true,
    createdAt: "creado_en",
    updatedAt: "actualizado_en",
    ...opciones,
  });
}
