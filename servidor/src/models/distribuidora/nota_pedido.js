import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Un pedido enviado por el cliente — inmutable una vez creado (snapshot de
 * lo que había en CarritoDistribuidora al momento de enviar). Sin pago
 * online: un empleado la procesa por fuera del sistema. `estado` es un
 * string libre a propósito (sin tabla de catálogo, no se pidió workflow
 * configurable) — valores esperados: "pendiente" | "en_curso" | "entregado" | "cancelada".
 *
 * `pagado` es independiente del `estado` — el pago (transferencia, efectivo,
 * cuenta corriente) puede confirmarse antes, durante o después de la
 * entrega, no siempre en el mismo orden.
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
  pagado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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
