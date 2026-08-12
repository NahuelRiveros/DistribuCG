import { PlanTipo, Membresia } from "../../models/index.js";
import { Op } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { crearCrudService } from "../common/crud_service.js";

const planesCrud = crearCrudService(PlanTipo, {
  defaultOrder: [["descripcion", "ASC"]],
  defaultAttributes: ["id", "descripcion", "dias_totales", "ingresos", "precio", "activo", "actualizado_en"],
});

export async function listarPlanes({ incluirInactivos = true } = {}) {
  const { items } = await planesCrud.listar({
    where: incluirInactivos ? undefined : { activo: true },
  });
  return items;
}

export async function obtenerPlanPorId(id) {
  return PlanTipo.findByPk(id, {
    attributes: ["id", "descripcion", "dias_totales", "ingresos", "precio", "activo"],
  });
}

export async function existePlanConDescripcion(descripcion, excluirId = null) {
  const where = { descripcion };
  if (excluirId) where.id = { [Op.ne]: excluirId };
  const plan = await PlanTipo.findOne({ where });
  return !!plan;
}

export async function crearPlan(data) {
  return PlanTipo.create({
    descripcion:  data.descripcion,
    dias_totales: data.dias_totales,
    ingresos:     data.ingresos,
    precio:       data.precio,
    activo:       true,
  });
}

export async function actualizarPlan(id, data) {
  const plan = await PlanTipo.findByPk(id);
  if (!plan) return null;

  await plan.update({
    descripcion:   data.descripcion,
    dias_totales:  data.dias_totales,
    ingresos:      data.ingresos,
    precio:        data.precio,
    actualizado_en: sequelize.literal("CURRENT_TIMESTAMP"),
  });

  return plan;
}

export async function planEstaUsado(id) {
  const uso = await Membresia.findOne({
    where: { plan_tipo_id: id },
    attributes: ["id"],
  });
  return !!uso;
}

export async function cambiarEstadoPlan(id, activo) {
  return planesCrud.cambiarEstado(id, activo);
}
