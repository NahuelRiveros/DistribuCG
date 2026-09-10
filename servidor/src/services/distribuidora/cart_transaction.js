import { sequelize } from "../../database/sequelize.js";
import { Usuario, CarritoDistribuidora, OperacionCarrito } from "../../models/index.js";
import { cartError, fingerprint } from "../common/cart_rules.js";
// Todas las escrituras y el envío toman el MISMO lock, también entre procesos.
export async function withCart(usuario_id, action) {
  return sequelize.transaction(async (t) => {
    const user = await Usuario.findByPk(usuario_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) throw cartError("Usuario no disponible", 401);
    const [cart] = await CarritoDistribuidora.findOrCreate({ where: { usuario_id }, defaults: { usuario_id }, transaction: t });
    return action(cart, t);
  });
}
export async function idempotent(usuario_id, key, payload, transaction, action) {
  if (typeof key !== "string" || !/^(merge|order|payment):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) throw cartError("Falta el identificador de la operación.");
  const huella = fingerprint(payload);
  const previous = await OperacionCarrito.findOne({ where: { usuario_id, clave: key }, transaction });
  if (previous) {
    if (previous.huella !== huella) throw cartError("La operación ya fue utilizada con otros datos.", 409);
    return previous.respuesta;
  }
  const response = await action();
  await OperacionCarrito.create({ usuario_id, clave: key, huella, respuesta: JSON.parse(JSON.stringify(response)) }, { transaction });
  return response;
}
