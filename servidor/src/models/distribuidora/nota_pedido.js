import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Un pedido enviado por el cliente — inmutable una vez creado (snapshot de
 * lo que había en CarritoDistribuidora al momento de enviar). Sin pago
 * online: un empleado la procesa por fuera del sistema. `estado` es un
 * string libre a propósito (sin tabla de catálogo, no se pidió workflow
 * configurable) — valores esperados: "pendiente" | "en_curso" | "entregado" | "cancelada".
 *
 * `estado_pago`/`monto_pagado` son independientes del `estado` de
 * cumplimiento, salvo por una regla: pasar a "en_curso" o "entregado"
 * requiere `estado_pago !== "pendiente"` (al menos un pago parcial), ver
 * ESTADOS_QUE_REQUIEREN_PAGO en nota_pedido_service.js. Reemplaza al viejo
 * booleano `pagado` — soporta pagos parciales (cliente mayorista que deja
 * una seña y paga el resto después). El detalle de cada pago vive en
 * NotaPedidoPago (ledger con quién/cuándo/anulado); estos dos campos son un
 * agregado denormalizado para no tener que sumar esa tabla en cada listado.
 *
 * cuit/razon_social/condicion_iva/direccion/provincia/localidad son un
 * SNAPSHOT de PerfilClienteDistribuidora al momento de crear el pedido — si
 * el cliente edita su perfil después, los pedidos viejos no cambian (mismo
 * criterio que nombre_producto/precio_unitario en NotaPedidoItem).
 */
export const NotaPedido = defineModel("NotaPedido", {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pendiente" },

  // "pendiente" | "parcial" | "pagado" — derivado de la suma de pagos
  // activos en NotaPedidoPago, nunca se escribe directo salvo al crear.
  estado_pago:  { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pendiente" },
  monto_pagado: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

  notas:  { type: DataTypes.TEXT, allowNull: true },

  cuit:          { type: DataTypes.STRING(20), allowNull: true },
  razon_social:  { type: DataTypes.STRING(150), allowNull: true },
  condicion_iva: { type: DataTypes.STRING(30), allowNull: true },
  direccion:     { type: DataTypes.STRING(200), allowNull: true },
  provincia:     { type: DataTypes.STRING(50), allowNull: true },
  localidad:     { type: DataTypes.STRING(100), allowNull: true },

  // snapshot de la suma de subtotales de sus items
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  fecha_alta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_mod:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "nota_pedido",
  indexes: [
    { fields: ["usuario_id"] },
    { fields: ["estado"] },
  ],
});
