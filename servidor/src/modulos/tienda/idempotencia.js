import { createHash } from "node:crypto";
import { Conflicto } from "../../nucleo/errores.js";
import { OperacionIdempotente } from "./modelos.js";

// Traído de DistribuCG (cart_transaction.js → idempotent): repetir una operación con la
// misma clave (doble click, reintento por corte de conexión) devuelve la respuesta original
// en vez de volver a ejecutarla. Misma clave con otros datos = error.
const huellaDe = (datos) => createHash("sha256").update(JSON.stringify(datos)).digest("hex");

export async function idempotente({ usuario_id, clave, datos, transaction }, accion) {
  const huella = huellaDe(datos);
  const previa = await OperacionIdempotente.findOne({ where: { usuario_id, clave }, transaction });
  if (previa) {
    if (previa.huella !== huella) throw new Conflicto("Esa operación ya se hizo con otros datos. Actualizá la página.", "OPERACION_DUPLICADA");
    return previa.respuesta;
  }
  const respuesta = await accion();
  await OperacionIdempotente.create({ usuario_id, clave, huella, respuesta: JSON.parse(JSON.stringify(respuesta ?? null)) }, { transaction });
  return respuesta;
}
