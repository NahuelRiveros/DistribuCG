import { ROLES_PANEL } from "compartido/reglas/roles.js";
import { aCentavos, desdeCentavos } from "compartido/reglas/dinero.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { Conflicto, NoEncontrado } from "../../nucleo/errores.js";
import { Pedido, PedidoCobro } from "./modelos.js";
import { obtenerPedido } from "./pedido_servicio.js";

// Adaptado de DistribuCG (nota_pedido_pago): los cobros registran dinero ya recibido
// (efectivo, transferencia...). Son independientes del estado del pedido y se anulan, no se borran.

async function pedidoBloqueado(id, transaction) {
  const pedido = await Pedido.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!pedido) throw new NoEncontrado("El pedido no existe.", "PEDIDO_NO_ENCONTRADO");
  return pedido;
}

/** monto_cobrado y estado_cobro salen SIEMPRE de la suma de cobros vigentes (nunca se escriben a mano). */
async function recalcular(pedido, transaction) {
  const vigentes = await PedidoCobro.findAll({ where: { pedido_id: pedido.id, anulado_en: null }, attributes: ["monto"], transaction });
  const cobrado = vigentes.reduce((suma, c) => suma + aCentavos(c.monto), 0);
  const total = aCentavos(pedido.total);
  const estado_cobro = cobrado <= 0 ? "pendiente" : cobrado >= total ? "cobrado" : "parcial";
  await pedido.update({ monto_cobrado: desdeCentavos(cobrado), estado_cobro }, { transaction });
}

export async function registrarCobro(pedido_id, { monto, metodo, nota }, usuario_id) {
  await sequelize.transaction(async (transaction) => {
    const pedido = await pedidoBloqueado(pedido_id, transaction);
    if (pedido.estado === "cancelado") throw new Conflicto("No se pueden registrar cobros en un pedido cancelado.", "PEDIDO_CANCELADO");
    const saldo = aCentavos(pedido.total) - aCentavos(pedido.monto_cobrado);
    if (aCentavos(monto) > saldo) {
      throw new Conflicto(`El cobro supera el saldo del pedido ($ ${desdeCentavos(saldo).toFixed(2).replace(".", ",")}).`, "COBRO_SUPERA_SALDO");
    }
    await PedidoCobro.create({ pedido_id, monto, metodo, nota: nota ?? null, registrado_por: usuario_id }, { transaction });
    await recalcular(pedido, transaction);
  });
  return obtenerPedido(pedido_id, { usuario: { roles: ROLES_PANEL } });
}

export async function anularCobro(pedido_id, cobro_id, { motivo }, usuario_id) {
  await sequelize.transaction(async (transaction) => {
    const pedido = await pedidoBloqueado(pedido_id, transaction);
    const cobro = await PedidoCobro.findOne({ where: { id: cobro_id, pedido_id }, transaction, lock: transaction.LOCK.UPDATE });
    if (!cobro) throw new NoEncontrado("El cobro no existe.", "COBRO_NO_ENCONTRADO");
    if (cobro.anulado_en) throw new Conflicto("Ese cobro ya estaba anulado.", "COBRO_ANULADO");
    await cobro.update({ anulado_en: new Date(), anulado_por: usuario_id, motivo_anulacion: motivo }, { transaction });
    await recalcular(pedido, transaction);
  });
  return obtenerPedido(pedido_id, { usuario: { roles: ROLES_PANEL } });
}
