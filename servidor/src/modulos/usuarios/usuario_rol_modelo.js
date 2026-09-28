import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";

export const UsuarioRol = defineModel("usuario_rol", {
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  rol_id: { type: DataTypes.INTEGER, allowNull: false },
});
