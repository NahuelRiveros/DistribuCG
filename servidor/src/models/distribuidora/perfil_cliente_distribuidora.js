import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Datos de facturación/entrega del cliente — 1:1 con Usuario, separado de
 * Persona a propósito (Persona la comparten gym/kinesiología, esto es
 * específico de este vertical). No se pide en el registro (fricción) — se
 * completa recién al enviar la primera nota de pedido (ver nota_pedido_service.js).
 * `condicion_iva` es un string libre a propósito, sin tabla de catálogo —
 * valores esperados: "responsable_inscripto" | "monotributista" | "exento" |
 * "consumidor_final" | null (no especificada).
 */
export const PerfilClienteDistribuidora = defineModel("PerfilClienteDistribuidora", {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "usuario", key: "id" },
  },

  cuit:           { type: DataTypes.STRING(20), allowNull: true },
  // vacío = usa nombre + apellido de la persona
  razon_social:   { type: DataTypes.STRING(150), allowNull: true },
  condicion_iva:  { type: DataTypes.STRING(30), allowNull: true },

  direccion: { type: DataTypes.STRING(200), allowNull: true },
  provincia: { type: DataTypes.STRING(50), allowNull: true },
  localidad: { type: DataTypes.STRING(100), allowNull: true },

  fecha_alta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_mod:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "perfil_cliente_distribuidora",
});
