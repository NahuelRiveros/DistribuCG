import { proyecto } from "compartido/proyecto.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { Conflicto } from "../../nucleo/errores.js";
import { Usuario } from "../usuarios/modelos.js";
import { Configuracion, ConfiguracionCambio } from "./modelos.js";

// Configuración editable desde el panel. Si una sección nunca se guardó, rige el valor
// inicial de proyecto.config.js. Se guarda en memoria para no ir a la base en cada pedido;
// al guardar se descarta (con más de una instancia del servidor habría que usar un caché compartido).

const INICIALES = { pagos: proyecto.pagos };
const cache = new Map();

/** Para los tests: olvida lo leído (la base se vacía entre tests). */
export const olvidarConfiguracion = () => cache.clear();

async function leer(clave) {
  if (!cache.has(clave)) {
    const fila = await Configuracion.findByPk(clave);
    cache.set(clave, fila?.valor ?? INICIALES[clave]);
  }
  return cache.get(clave);
}

/** Configuración de pagos vigente (medios, cuotas, promociones, CBU, cinta). */
export const obtenerPagos = () => leer("pagos");

const nombreUsuario = ["id", "nombre", "apellido"];

/** Para el panel: el valor, su "versión" (para no pisar cambios ajenos) y los últimos cambios. */
export async function obtenerParaEditar(clave) {
  const [fila, cambios] = await Promise.all([
    Configuracion.findByPk(clave, { include: [{ model: Usuario, as: "editor", attributes: nombreUsuario }] }),
    ConfiguracionCambio.findAll({
      where: { clave },
      attributes: ["id", "creado_en"],
      include: [{ model: Usuario, as: "usuario", attributes: nombreUsuario }],
      order: [["id", "DESC"]],
      limit: 10,
    }),
  ]);
  return {
    valor: fila?.valor ?? INICIALES[clave],
    version: fila ? fila.actualizado_en.toISOString() : null,
    historial: cambios.map((c) => c.get({ plain: true })),
  };
}

/**
 * Guarda una sección (ya validada con su schema). `version` es la que vio quien edita:
 * si otra persona guardó mientras tanto, se avisa en vez de pisar sus cambios.
 */
export async function guardar(actor, clave, { valor, version }) {
  await sequelize.transaction(async (transaction) => {
    const fila = await Configuracion.findByPk(clave, { transaction, lock: transaction.LOCK.UPDATE });
    const actual = fila ? fila.actualizado_en.toISOString() : null;
    if (actual !== version) {
      throw new Conflicto("Otra persona cambió esta configuración mientras la editabas. Recargá la página para ver los cambios.", "CONFIGURACION_CAMBIO");
    }
    const anterior = fila?.valor ?? INICIALES[clave];
    if (fila) await fila.update({ valor, actualizado_por: actor.id }, { transaction });
    else await Configuracion.create({ clave, valor, actualizado_por: actor.id }, { transaction });
    await ConfiguracionCambio.create({ clave, valor_anterior: anterior, valor_nuevo: valor, usuario_id: actor.id }, { transaction });
  });
  cache.delete(clave);
  return obtenerParaEditar(clave);
}
