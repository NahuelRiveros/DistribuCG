import { Op, QueryTypes } from "sequelize";
import { proyecto } from "compartido/proyecto.js";
import { tieneRol, ROLES_PANEL } from "compartido/reglas/roles.js";
import { problemaTransicion } from "compartido/reglas/pedido_transiciones.js";
import { faseStock, movimientosEntreFases } from "compartido/reglas/pedido_stock.js";
import { totalesPedido } from "compartido/reglas/pedido_totales.js";
import { mediosTienda, totalConMedio } from "compartido/reglas/pagos.js";
import { obtenerPagos } from "../configuracion/configuracion_servicio.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { Conflicto, DatosInvalidos, NoEncontrado } from "../../nucleo/errores.js";
import { armarPaginacion, normalizarPaginacion } from "../../nucleo/paginacion.js";
import { patronContiene } from "../../nucleo/consultas.js";
import { Usuario } from "../usuarios/modelos.js";
import { registrarMovimientos } from "../stock/movimientos.js";
import { CarritoItem, Pedido, PedidoCobro, PedidoEstadoLog, PedidoItem } from "./modelos.js";
import { armarLinea, conCarrito, datosVariantes } from "./carrito_servicio.js";
import { idempotente } from "./idempotencia.js";
import { obtenerPerfil } from "./perfil_servicio.js";

const CON_STOCK = proyecto.modulos.stock;
const ESTADO_INICIAL = "pendiente";
const nombreUsuario = ["id", "nombre", "apellido"];

/**
 * Lleva el stock de las líneas del pedido a la fase que corresponde a `estado`
 * (reservar, descontar, liberar o devolver). Cada movimiento lleva el pedido como
 * referencia. Si falta stock (ej. al reabrir un pedido cancelado) falla todo.
 */
async function moverStock(pedido, estado, { usuario_id, transaction }) {
  if (!CON_STOCK) return;
  const hasta = faseStock(estado);
  if (hasta === pedido.stock_fase) return;
  const items = await PedidoItem.findAll({ where: { pedido_id: pedido.id, controla_stock: true }, transaction });
  // Si una presentación dejó de controlar stock después del pedido, ya no hay nada que mover.
  const actuales = await datosVariantes(items.map((i) => i.variante_id), { transaction });
  const movimientos = items
    .filter((i) => actuales.get(i.variante_id)?.controla_stock)
    .flatMap((i) =>
      movimientosEntreFases(pedido.stock_fase, hasta, i.cantidad).map((m) => ({
        ...m,
        variante_id: i.variante_id,
        referencia_tipo: "pedido",
        referencia_id: pedido.id,
        usuario_id,
      })),
    );
  await registrarMovimientos(movimientos, { transaction });
  await pedido.update({ stock_fase: hasta }, { transaction });
}

function mismoCarrito(lineas, esperado) {
  if (lineas.length !== esperado.length) return false;
  return lineas.every((l) => {
    const visto = esperado.find((e) => e.variante_id === l.variante_id);
    return visto && visto.cantidad === l.cantidad && Number(visto.precio_final_unitario) === Number(l.precio_final_unitario);
  });
}

/**
 * Envía el carrito como pedido, en una sola transacción: recalcula precios, verifica
 * que el cliente vio lo mismo, guarda la copia fija, mueve el stock y vacía el carrito.
 * Idempotente: la misma `clave` devuelve el mismo pedido (doble click, reintento).
 */
export async function enviarPedido(usuario_id, { clave, modalidad_entrega, medio_pago, descuento_esperado, notas, esperado }) {
  const pagos = await obtenerPagos();
  const medio = mediosTienda(pagos).find((m) => m.valor === medio_pago);
  if (!medio) throw new DatosInvalidos("Revisá los datos ingresados.", [{ campo: "medio_pago", mensaje: "Elegí cómo vas a pagar" }]);

  const { pedido_id } = await conCarrito(usuario_id, (carrito, transaction) =>
    idempotente({ usuario_id, clave: `pedido:${clave}`, datos: { modalidad_entrega, medio_pago, descuento_esperado, notas, esperado }, transaction }, async () => {
      const perfil = await obtenerPerfil(usuario_id, { transaction });
      if (!perfil) throw new DatosInvalidos("Completá tus datos de entrega antes de enviar el pedido.", [], "PERFIL_INCOMPLETO");

      const items = await CarritoItem.findAll({ where: { carrito_id: carrito.id }, order: [["variante_id", "ASC"]], transaction });
      if (items.length === 0) throw new Conflicto("Tu carrito está vacío.", "CARRITO_VACIO");

      // Bloquea las presentaciones: precio y stock no cambian hasta terminar.
      const datos = await datosVariantes(items.map((i) => i.variante_id), { transaction, bloquear: true });
      const lineas = items.map((i) => armarLinea({ variante_id: i.variante_id, cantidad: i.cantidad }, datos.get(i.variante_id)));
      if (lineas.some((l) => l.problema)) {
        throw new Conflicto("Hay productos sin stock suficiente o que ya no están disponibles. Revisá tu carrito.", "CARRITO_CON_PROBLEMAS");
      }
      if (medio.descuento !== descuento_esperado) {
        throw new Conflicto("Cambió el descuento del medio de pago. Revisá el total y confirmá de nuevo.", "DESCUENTO_CAMBIO");
      }
      if (!mismoCarrito(lineas, esperado)) {
        throw new Conflicto("Cambió el precio o la cantidad de algún producto. Revisá el pedido y confirmá de nuevo.", "CARRITO_CAMBIO");
      }
      const totales = totalesPedido(lineas.map((l) => ({ precio: l.precio, iva_porcentaje: l.iva_porcentaje, cantidad: l.cantidad })));
      const minimo = proyecto.tienda.pedido_minimo;
      // El mínimo se mide sobre la mercadería, antes del descuento por medio de pago.
      if (minimo != null && totales.total < minimo) throw new Conflicto(`El pedido mínimo es de $ ${minimo}.`, "PEDIDO_MINIMO");
      const conMedio = totalConMedio(totales.total, medio_pago, pagos);

      const usuario = await Usuario.findByPk(usuario_id, { attributes: ["nombre", "apellido", "email"], transaction });
      const pedido = await Pedido.create(
        {
          usuario_id,
          estado: ESTADO_INICIAL,
          modalidad_entrega,
          // Copia de los datos al enviar: si el cliente los cambia después, el pedido no cambia.
          entrega: { nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, ...perfil },
          notas: notas ?? null,
          subtotal_neto: totales.subtotal_neto,
          total_iva: totales.iva,
          medio_pago,
          descuento: conMedio.descuento,
          total: conMedio.total,
        },
        { transaction },
      );
      await PedidoItem.bulkCreate(
        lineas.map((l) => ({
          pedido_id: pedido.id,
          variante_id: l.variante_id,
          producto_id: l.producto_id,
          nombre_producto: l.producto,
          presentacion: l.presentacion,
          sku: l.sku,
          precio_unitario: l.precio,
          iva_porcentaje: l.iva_porcentaje,
          precio_final_unitario: l.precio_final_unitario,
          cantidad: l.cantidad,
          subtotal_final: l.subtotal_final,
          controla_stock: Boolean(datos.get(l.variante_id).controla_stock),
        })),
        { transaction },
      );
      await PedidoEstadoLog.create({ pedido_id: pedido.id, estado_anterior: null, estado_nuevo: ESTADO_INICIAL, motivo: "Pedido enviado por el cliente", usuario_id }, { transaction });
      await moverStock(pedido, ESTADO_INICIAL, { usuario_id, transaction });
      await CarritoItem.destroy({ where: { carrito_id: carrito.id }, transaction });
      return { pedido_id: pedido.id };
    }),
  );
  return obtenerPedido(pedido_id, { usuario: { id: usuario_id, roles: [] } });
}

/** Cambio de estado desde el panel: valida la transición, pide motivo si corresponde y mueve el stock. */
export async function cambiarEstado(id, { estado, motivo, estado_actual }, usuario_id) {
  await sequelize.transaction(async (transaction) => {
    const pedido = await Pedido.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!pedido) throw new NoEncontrado("El pedido no existe.", "PEDIDO_NO_ENCONTRADO");
    if (estado_actual && estado_actual !== pedido.estado) {
      throw new Conflicto("Otra persona cambió el estado de este pedido mientras tanto. Actualizá la página.", "PEDIDO_CAMBIO");
    }
    const problema = problemaTransicion({ desde: pedido.estado, hacia: estado, motivo, estadoCobro: pedido.estado_cobro });
    if (problema) throw new Conflicto(problema, "TRANSICION_INVALIDA");
    if (estado === pedido.estado) return;

    await moverStock(pedido, estado, { usuario_id, transaction });
    await PedidoEstadoLog.create({ pedido_id: pedido.id, estado_anterior: pedido.estado, estado_nuevo: estado, motivo: motivo ?? null, usuario_id }, { transaction });
    await pedido.update({ estado }, { transaction });
  });
  return obtenerPedido(id, { usuario: { roles: ROLES_PANEL } });
}

/** Detalle completo. Un cliente solo puede ver sus pedidos (el resto responde 404). */
export async function obtenerPedido(id, { usuario }) {
  const pedido = await Pedido.findByPk(id, {
    include: [
      { model: PedidoItem, as: "items", separate: true, order: [["id", "ASC"]] },
      { model: PedidoEstadoLog, as: "historial", separate: true, order: [["id", "ASC"]], include: [{ model: Usuario, as: "usuario", attributes: nombreUsuario }] },
      {
        model: PedidoCobro,
        as: "cobros",
        separate: true,
        order: [["id", "ASC"]],
        include: [
          { model: Usuario, as: "registrado_por_usuario", attributes: nombreUsuario },
          { model: Usuario, as: "anulado_por_usuario", attributes: nombreUsuario },
        ],
      },
    ],
  });
  if (!pedido || (!tieneRol(usuario, ROLES_PANEL) && pedido.usuario_id !== usuario.id)) {
    throw new NoEncontrado("El pedido no existe.", "PEDIDO_NO_ENCONTRADO");
  }
  const datos = pedido.get({ plain: true });
  return { ...datos, saldo: Math.round((Number(datos.total) - Number(datos.monto_cobrado)) * 100) / 100 };
}

const ATRIBUTOS_LISTADO = ["id", "usuario_id", "estado", "estado_cobro", "modalidad_entrega", "entrega", "medio_pago", "total", "monto_cobrado", "creado_en", "actualizado_en"];
const cantidadItems = [
  sequelize.literal(`(SELECT COUNT(*)::int FROM ${DB_SCHEMA}.pedido_item i WHERE i.pedido_id = "pedido"."id")`),
  "cantidad_items",
];

export async function misPedidos(usuario_id, { pagina, limite }) {
  const pag = normalizarPaginacion({ pagina, limite, limitePorDefecto: 10 });
  const { rows, count } = await Pedido.findAndCountAll({
    where: { usuario_id },
    attributes: [...ATRIBUTOS_LISTADO, cantidadItems],
    order: [["id", "DESC"]],
    limit: pag.limite,
    offset: pag.offset,
  });
  return { data: rows.map((r) => r.get({ plain: true })), paginacion: armarPaginacion({ ...pag, total: count }) };
}

/** Listado del panel: por estado, estado de cobro, número ("#12" o "12") o cliente (nombre / email). */
export async function listarPedidos({ q, estado, estado_cobro, pagina, limite }) {
  const pag = normalizarPaginacion({ pagina, limite, limitePorDefecto: 20 });
  const condiciones = [];
  if (estado) condiciones.push({ estado });
  if (estado_cobro) condiciones.push({ estado_cobro });
  if (q) {
    const numero = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
    const patron = patronContiene(q);
    const clientes = await sequelize.query(
      `SELECT id FROM ${DB_SCHEMA}.usuario WHERE nombre ILIKE :patron OR apellido ILIKE :patron OR email ILIKE :patron LIMIT 500`,
      { replacements: { patron }, type: QueryTypes.SELECT },
    );
    condiciones.push({ [Op.or]: [{ usuario_id: { [Op.in]: clientes.map((c) => c.id) } }, ...(numero ? [{ id: numero }] : [])] });
  }
  const { rows, count } = await Pedido.findAndCountAll({
    where: { [Op.and]: condiciones },
    attributes: [...ATRIBUTOS_LISTADO, cantidadItems],
    order: [["id", "DESC"]],
    limit: pag.limite,
    offset: pag.offset,
  });
  return { data: rows.map((r) => r.get({ plain: true })), paginacion: armarPaginacion({ ...pag, total: count }) };
}

export async function resumenPedidos() {
  const [fila] = await sequelize.query(
    `SELECT COUNT(*) FILTER (WHERE estado = 'pendiente')::int AS nuevos,
            COUNT(*) FILTER (WHERE estado = 'en_preparacion')::int AS en_preparacion,
            COUNT(*) FILTER (WHERE estado <> 'cancelado' AND estado_cobro <> 'cobrado')::int AS por_cobrar
     FROM ${DB_SCHEMA}.pedido`,
    { type: QueryTypes.SELECT },
  );
  return fila;
}
