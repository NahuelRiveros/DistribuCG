// Tablas de migraciones/2026_09_25_1600_crear_tienda.js. Importar siempre desde acá.
import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";
import { aplicarRelaciones } from "../../nucleo/db/relaciones.js";
import { Variante } from "../catalogo/modelos.js";
import { Usuario } from "../usuarios/modelos.js";

// Función (no objeto compartido): Sequelize modifica la definición de cada columna,
// y un mismo objeto reusado hace que varias columnas terminen apuntando a la misma.
const dinero = (extra = {}) => ({ type: DataTypes.DECIMAL(12, 2), allowNull: false, ...extra });
const soloCreacion = { updatedAt: false };

export const PerfilCliente = defineModel("perfil_cliente", {
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  telefono: { type: DataTypes.STRING(40), allowNull: false },
  direccion: { type: DataTypes.STRING(200), allowNull: false },
  localidad: { type: DataTypes.STRING(100), allowNull: false },
  provincia: { type: DataTypes.STRING(60), allowNull: false },
  codigo_postal: { type: DataTypes.STRING(15), allowNull: true },
  indicaciones: { type: DataTypes.STRING(300), allowNull: true },
  razon_social: { type: DataTypes.STRING(150), allowNull: true },
  cuit: { type: DataTypes.STRING(11), allowNull: true },
  condicion_iva: { type: DataTypes.STRING(30), allowNull: true },
});

export const Carrito = defineModel("carrito", {
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
});

export const CarritoItem = defineModel("carrito_item", {
  carrito_id: { type: DataTypes.INTEGER, allowNull: false },
  variante_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_al_agregar: dinero(),
});

export const OperacionIdempotente = defineModel(
  "operacion_idempotente",
  {
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    clave: { type: DataTypes.STRING(60), allowNull: false },
    huella: { type: DataTypes.STRING(64), allowNull: false },
    respuesta: { type: DataTypes.JSONB, allowNull: false },
  },
  soloCreacion,
);

export const Pedido = defineModel("pedido", {
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.STRING(20), allowNull: false },
  estado_cobro: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pendiente" },
  stock_fase: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "ninguna" },
  modalidad_entrega: { type: DataTypes.STRING(20), allowNull: false },
  entrega: { type: DataTypes.JSONB, allowNull: false },
  notas: { type: DataTypes.TEXT, allowNull: true },
  subtotal_neto: dinero(),
  total_iva: dinero(),
  // Medio que eligió el cliente y el descuento que tuvo por eso. total ya viene descontado.
  medio_pago: { type: DataTypes.STRING(30), allowNull: true },
  descuento: dinero({ defaultValue: 0 }),
  total: dinero(),
  monto_cobrado: dinero({ defaultValue: 0 }),
});

export const PedidoItem = defineModel(
  "pedido_item",
  {
    pedido_id: { type: DataTypes.INTEGER, allowNull: false },
    variante_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre_producto: { type: DataTypes.STRING(150), allowNull: false },
    presentacion: { type: DataTypes.STRING(100), allowNull: true },
    sku: { type: DataTypes.STRING(60), allowNull: true },
    precio_unitario: dinero(),
    iva_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    precio_final_unitario: dinero(),
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    subtotal_final: dinero(),
    controla_stock: { type: DataTypes.BOOLEAN, allowNull: false },
  },
  soloCreacion,
);

export const PedidoEstadoLog = defineModel(
  "pedido_estado_log",
  {
    pedido_id: { type: DataTypes.INTEGER, allowNull: false },
    estado_anterior: { type: DataTypes.STRING(20), allowNull: true },
    estado_nuevo: { type: DataTypes.STRING(20), allowNull: false },
    motivo: { type: DataTypes.STRING(500), allowNull: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  soloCreacion,
);

export const PedidoCobro = defineModel(
  "pedido_cobro",
  {
    pedido_id: { type: DataTypes.INTEGER, allowNull: false },
    monto: dinero(),
    metodo: { type: DataTypes.STRING(30), allowNull: false },
    nota: { type: DataTypes.STRING(255), allowNull: true },
    registrado_por: { type: DataTypes.INTEGER, allowNull: false },
    anulado_en: { type: DataTypes.DATE, allowNull: true },
    anulado_por: { type: DataTypes.INTEGER, allowNull: true },
    motivo_anulacion: { type: DataTypes.STRING(300), allowNull: true },
  },
  soloCreacion,
);

aplicarRelaciones([
  { tipo: "belongsTo", from: PerfilCliente, to: Usuario, foreignKey: "usuario_id", as: "usuario" },
  { tipo: "hasMany", from: Carrito, to: CarritoItem, foreignKey: "carrito_id", as: "items" },
  { tipo: "belongsTo", from: CarritoItem, to: Variante, foreignKey: "variante_id", as: "variante" },
  { tipo: "belongsTo", from: Pedido, to: Usuario, foreignKey: "usuario_id", as: "cliente" },
  { tipo: "hasMany", from: Pedido, to: PedidoItem, foreignKey: "pedido_id", as: "items" },
  { tipo: "hasMany", from: Pedido, to: PedidoEstadoLog, foreignKey: "pedido_id", as: "historial" },
  { tipo: "hasMany", from: Pedido, to: PedidoCobro, foreignKey: "pedido_id", as: "cobros" },
  { tipo: "belongsTo", from: PedidoEstadoLog, to: Usuario, foreignKey: "usuario_id", as: "usuario" },
  { tipo: "belongsTo", from: PedidoCobro, to: Usuario, foreignKey: "registrado_por", as: "registrado_por_usuario" },
  { tipo: "belongsTo", from: PedidoCobro, to: Usuario, foreignKey: "anulado_por", as: "anulado_por_usuario" },
]);
