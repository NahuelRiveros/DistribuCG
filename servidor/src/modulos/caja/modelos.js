// Tablas de migraciones/2026_09_28_1200_crear_caja.js. Importar siempre desde acá.
import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";
import { aplicarRelaciones } from "../../nucleo/db/relaciones.js";
import { Usuario } from "../usuarios/modelos.js";

export const CajaCategoria = defineModel("caja_categoria", {
  tipo: { type: DataTypes.STRING(10), allowNull: false },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
  activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

export const CajaMovimiento = defineModel("caja_movimiento", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.STRING(10), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  categoria_id: { type: DataTypes.INTEGER, allowNull: false },
  medio: { type: DataTypes.STRING(30), allowNull: false },
  descripcion: { type: DataTypes.STRING(200), allowNull: true },
  registrado_por: { type: DataTypes.INTEGER, allowNull: false },
  actualizado_por: { type: DataTypes.INTEGER, allowNull: true },
  anulado_en: { type: DataTypes.DATE, allowNull: true },
  anulado_por: { type: DataTypes.INTEGER, allowNull: true },
  motivo_anulacion: { type: DataTypes.STRING(300), allowNull: true },
});

aplicarRelaciones([
  { tipo: "belongsTo", from: CajaMovimiento, to: CajaCategoria, foreignKey: "categoria_id", as: "categoria" },
  { tipo: "belongsTo", from: CajaMovimiento, to: Usuario, foreignKey: "registrado_por", as: "registrador" },
  { tipo: "belongsTo", from: CajaMovimiento, to: Usuario, foreignKey: "anulado_por", as: "anulador" },
]);
