import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";

// `codigo` es lo que viaja en req.usuario.roles y se usa en requerirRol().
export const Rol = defineModel("rol", {
  codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(150), allowNull: false },
});

export const ROLES = [
  { codigo: "super_admin", descripcion: "Super administrador de la plataforma" },
  { codigo: "admin", descripcion: "Administrador del negocio" },
  { codigo: "staff", descripcion: "Personal" },
  { codigo: "cliente", descripcion: "Cliente de la tienda" },
];
