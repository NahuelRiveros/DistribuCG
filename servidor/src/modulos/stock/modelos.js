// Tablas de migraciones/2026_09_25_1500_crear_stock.js. Importar siempre desde acá.
import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";
import { aplicarRelaciones } from "../../nucleo/db/relaciones.js";
import { Variante } from "../catalogo/modelos.js";
import { Usuario } from "../usuarios/modelos.js";

export const Stock = defineModel("stock", {
  variante_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  reservado: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

// Solo INSERT: la base rechaza UPDATE y DELETE (trigger).
export const MovimientoStock = defineModel(
  "movimiento_stock",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    variante_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reservado: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    saldo_cantidad: { type: DataTypes.INTEGER, allowNull: false },
    saldo_reservado: { type: DataTypes.INTEGER, allowNull: false },
    costo_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    motivo: { type: DataTypes.STRING(200), allowNull: true },
    referencia_tipo: { type: DataTypes.STRING(30), allowNull: true },
    referencia_id: { type: DataTypes.STRING(60), allowNull: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { updatedAt: false },
);

aplicarRelaciones([
  { tipo: "belongsTo", from: Stock, to: Variante, foreignKey: "variante_id", as: "variante" },
  { tipo: "hasOne", from: Variante, to: Stock, foreignKey: "variante_id", as: "stock" },
  { tipo: "belongsTo", from: MovimientoStock, to: Variante, foreignKey: "variante_id", as: "variante" },
  { tipo: "belongsTo", from: MovimientoStock, to: Usuario, foreignKey: "usuario_id", as: "usuario" },
]);
