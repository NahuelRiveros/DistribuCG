import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

// Un carrito activo por usuario.
export const Carrito = defineModel("Carrito", {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "usuario", key: "id" },
  },

  fecha_alta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_mod:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "carrito",
});
