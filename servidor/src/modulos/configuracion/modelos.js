// Tablas de migraciones/2026_09_28_1400_crear_configuracion.js. Importar siempre desde acá.
import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";
import { aplicarRelaciones } from "../../nucleo/db/relaciones.js";
import { Usuario } from "../usuarios/modelos.js";

export const Configuracion = defineModel("configuracion", {
  clave: { type: DataTypes.STRING(40), primaryKey: true },
  valor: { type: DataTypes.JSONB, allowNull: false },
  actualizado_por: { type: DataTypes.INTEGER, allowNull: true },
});

export const ConfiguracionCambio = defineModel(
  "configuracion_cambio",
  {
    clave: { type: DataTypes.STRING(40), allowNull: false },
    valor_anterior: { type: DataTypes.JSONB, allowNull: true },
    valor_nuevo: { type: DataTypes.JSONB, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { updatedAt: false },
);

aplicarRelaciones([
  { tipo: "belongsTo", from: Configuracion, to: Usuario, foreignKey: "actualizado_por", as: "editor" },
  { tipo: "belongsTo", from: ConfiguracionCambio, to: Usuario, foreignKey: "usuario_id", as: "usuario" },
]);
