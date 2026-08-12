import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Estados posibles de un alumno.
 * Valores esperados: Activo (id=1), Inactivo (id=2), Suspendido (id=3).
 * El cron actualiza alumno.estado_id automáticamente según membresías vigentes.
 */
export const AlumnoEstado = defineModel("AlumnoEstado", {
  descripcion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "alumno_estado",
});
