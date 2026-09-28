import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";

// Tabla creada en migraciones/2026_09_25_1200_crear_usuarios_y_roles.js.
// activo=false: suspendido (puede reactivarse). eliminado_en: baja definitiva.
export const Usuario = defineModel("usuario", {
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  apellido: { type: DataTypes.STRING(80), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: false },
  // Hash bcrypt. Nunca devolverlo en una respuesta: usar ATRIBUTOS_PUBLICOS.
  contrasena: { type: DataTypes.STRING(255), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ultimo_login: { type: DataTypes.DATE, allowNull: true },
  eliminado_en: { type: DataTypes.DATE, allowNull: true },
});

export const ATRIBUTOS_PUBLICOS = ["id", "nombre", "apellido", "email", "activo"];
