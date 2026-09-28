import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../nucleo/errores.js";
import { MovimientoStock } from "./modelos.js";

/**
 * ÚNICA puerta para cambiar el stock (ver CLAUDE.md y la skill dominio-inventario).
 * En la misma transacción: actualiza el saldo con una condición atómica
 * (nunca queda negativo ni lo reservado supera lo que hay) y registra el movimiento.
 *
 * cantidad  = cambio en la cantidad física (+ entra, − sale)
 * reservado = cambio en lo reservado para pedidos (+ reserva, − libera)
 */

// Qué combinaciones tiene sentido cada tipo. Un error acá es un bug del código, no del usuario.
const REGLAS = {
  ingreso: ({ cantidad, reservado }) => cantidad > 0 && reservado === 0,
  devolucion: ({ cantidad, reservado }) => cantidad > 0 && reservado === 0,
  ajuste: ({ cantidad, reservado }) => cantidad !== 0 && reservado === 0,
  importacion: ({ cantidad, reservado }) => cantidad !== 0 && reservado === 0,
  reserva: ({ cantidad, reservado }) => cantidad === 0 && reservado > 0,
  liberacion: ({ cantidad, reservado }) => cantidad === 0 && reservado < 0,
  // Venta directa (reservado 0) o de lo que estaba reservado (reservado = cantidad).
  venta: ({ cantidad, reservado }) => cantidad < 0 && (reservado === 0 || reservado === cantidad),
};

async function datosVariante(variante_id, transaction) {
  const [fila] = await sequelize.query(
    `SELECT v.id, v.controla_stock, p.nombre AS producto, v.nombre AS presentacion
     FROM ${DB_SCHEMA}.variante v JOIN ${DB_SCHEMA}.producto p ON p.id = v.producto_id
     WHERE v.id = :variante_id AND v.eliminado_en IS NULL AND p.eliminado_en IS NULL`,
    { replacements: { variante_id }, type: QueryTypes.SELECT, transaction },
  );
  if (!fila) throw new NoEncontrado("La presentación no existe.", "PRESENTACION_NO_ENCONTRADA");
  return fila;
}

const nombreDe = (v) => (v.presentacion ? `${v.producto} (${v.presentacion})` : v.producto);

export async function registrarMovimiento(datos, { transaction }) {
  const { variante_id, tipo, cantidad = 0, reservado = 0 } = datos;
  if (!REGLAS[tipo]?.({ cantidad, reservado })) throw new DatosInvalidos(`Movimiento de stock inválido (${tipo}).`);

  const variante = await datosVariante(variante_id, transaction);
  if (!variante.controla_stock) throw new Conflicto(`${nombreDe(variante)} no controla stock.`, "STOCK_NO_CONTROLADO");

  await sequelize.query(`INSERT INTO ${DB_SCHEMA}.stock (variante_id) VALUES (:variante_id) ON CONFLICT (variante_id) DO NOTHING`, {
    replacements: { variante_id },
    transaction,
  });
  const [saldo] = await sequelize.query(
    `UPDATE ${DB_SCHEMA}.stock
     SET cantidad = cantidad + :cantidad, reservado = reservado + :reservado, actualizado_en = now()
     WHERE variante_id = :variante_id
       AND cantidad + :cantidad >= 0
       AND reservado + :reservado >= 0
       AND reservado + :reservado <= cantidad + :cantidad
     RETURNING cantidad, reservado`,
    { replacements: { variante_id, cantidad, reservado }, type: QueryTypes.SELECT, transaction },
  );
  if (!saldo) {
    const [actual] = await sequelize.query(`SELECT cantidad, reservado FROM ${DB_SCHEMA}.stock WHERE variante_id = :variante_id`, {
      replacements: { variante_id },
      type: QueryTypes.SELECT,
      transaction,
    });
    const disponible = actual.cantidad - actual.reservado;
    throw new Conflicto(`No hay stock suficiente de ${nombreDe(variante)}: hay ${disponible} disponible(s).`, "STOCK_INSUFICIENTE");
  }

  return MovimientoStock.create(
    {
      variante_id,
      tipo,
      cantidad,
      reservado,
      saldo_cantidad: saldo.cantidad,
      saldo_reservado: saldo.reservado,
      costo_unitario: datos.costo_unitario ?? null,
      motivo: datos.motivo ?? null,
      referencia_tipo: datos.referencia_tipo ?? null,
      referencia_id: datos.referencia_id != null ? String(datos.referencia_id) : null,
      usuario_id: datos.usuario_id ?? null,
    },
    { transaction },
  );
}

/**
 * Varios movimientos en la misma transacción (un ingreso, un pedido).
 * Siempre en orden de variante_id: dos operaciones simultáneas sobre los mismos
 * productos bloquean las filas en el mismo orden y no se traban entre sí (deadlock).
 */
export async function registrarMovimientos(lista, { transaction }) {
  const ordenada = [...lista].sort((a, b) => a.variante_id - b.variante_id);
  const creados = [];
  for (const datos of ordenada) creados.push(await registrarMovimiento(datos, { transaction }));
  return creados;
}

/** Ejecuta en la transacción recibida o abre una propia. */
export function conTransaccion(transaction, trabajo) {
  return transaction ? trabajo(transaction) : sequelize.transaction(trabajo);
}
