import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Credenciales de acceso al sistema (admins y staff).
 * Relación 1:1 con persona — persona_id es UNIQUE.
 * No toda persona tiene usuario; solo quienes operan el sistema.
 */
export const Usuario = defineModel("Usuario", {
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "persona", key: "id" },
  },

  // Hash bcrypt — nunca almacenar texto plano
  contrasena:    { type: DataTypes.STRING(255), allowNull: false },
  activo:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ultimo_login:  { type: DataTypes.DATE, allowNull: true },

  creado_en:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // activo=false: suspendido temporalmente (puede reactivarse)
  // eliminado_en no null: baja definitiva — no puede iniciar sesión ni reactivarse
  eliminado_en:  { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "usuario",
  indexes: [
    { fields: ["persona_id"] },
  ],
});
