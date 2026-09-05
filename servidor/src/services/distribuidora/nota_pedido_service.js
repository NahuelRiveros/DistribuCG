import { sequelize } from "../../database/sequelize.js";
import { NotaPedido, NotaPedidoItem, NotaPedidoPago, Persona, Usuario } from "../../models/index.js";
import { obtenerOCrearCarrito, listarItemsCarrito, vaciarCarrito } from "./carrito_distribuidora_service.js";
import { obtenerPerfil, perfilCompleto } from "./perfil_cliente_service.js";

// Pasar a estos estados exige que el pedido tenga al menos un pago parcial
// (estado_pago !== "pendiente") — no hace falta estar 100% pagado, pero no
// se puede avanzar un pedido en el que no se cobró nada. Incluye "entregado"
// además de "en_curso" para que no se pueda saltear el requisito saltando
// directo de "pendiente" a "entregado" (el UI permite cualquier salto).
const ESTADOS_QUE_REQUIEREN_PAGO = ["en_curso", "entregado"];

// Nota: Sequelize no soporta `order` dentro de un include anidado — si hace
// falta un orden garantizado, se ordena en el consumidor (el frontend ya
// lo hace por fecha al renderizar el historial de pagos).
const INCLUDE_PAGOS = {
  model: NotaPedidoPago,
  as: "pagos",
  include: [
    { model: Usuario, as: "registrado_por_usuario", attributes: ["id"], include: [{ model: Persona, as: "persona", attributes: ["nombre", "apellido"] }] },
    { model: Usuario, as: "anulado_por_usuario", attributes: ["id"], include: [{ model: Persona, as: "persona", attributes: ["nombre", "apellido"] }] },
  ],
};

/**
 * Recalcula estado_pago/monto_pagado de un NotaPedido a partir de la suma de
 * sus pagos activos (anulado_en IS NULL) — se llama siempre dentro de la
 * misma transacción que crea o anula un pago, nunca se escriben esos campos
 * a mano desde otro lado.
 */
async function recomputarEstadoPago(nota_pedido_id, t) {
  const nota = await NotaPedido.findByPk(nota_pedido_id, { transaction: t, lock: t.LOCK.UPDATE });
  const pagosActivos = await NotaPedidoPago.findAll({
    where: { nota_pedido_id, anulado_en: null },
    transaction: t,
  });
  const monto_pagado = pagosActivos.reduce((s, p) => s + Number(p.monto), 0);
  const estado_pago = monto_pagado <= 0 ? "pendiente" : monto_pagado >= Number(nota.total) ? "pagado" : "parcial";
  await nota.update({ monto_pagado, estado_pago, fecha_mod: new Date() }, { transaction: t });
  return nota;
}

/**
 * Snapshotea el CarritoDistribuidora actual del usuario a un NotaPedido +
 * NotaPedidoItem (inmutable) y vacía el carrito. Sin pago online — queda
 * "pendiente" hasta que un empleado la procese por fuera del sistema.
 *
 * Exige que el cliente ya tenga PerfilClienteDistribuidora completo (cuit +
 * dirección) — si no, tira PERFIL_INCOMPLETO para que el frontend le pida
 * completarlo antes de reintentar (no se pide en el registro, ver
 * perfil_cliente_service.js).
 */
export async function crearNotaPedido(usuario_id, { notas = null } = {}) {
  const perfil = await obtenerPerfil(usuario_id);
  if (!perfilCompleto(perfil)) {
    throw Object.assign(new Error("Completá tus datos de entrega antes de enviar el pedido"), { status: 400, codigo: "PERFIL_INCOMPLETO" });
  }

  const carrito = await obtenerOCrearCarrito(usuario_id);
  const items = await listarItemsCarrito(carrito.id);

  if (items.length === 0) {
    throw Object.assign(new Error("El pedido está vacío"), { status: 400 });
  }
  if (items.some((i) => i.activo === false || i.variante_disponible === false)) {
    throw Object.assign(new Error("Hay productos no disponibles en el pedido — revisalos antes de enviar"), { status: 400 });
  }

  const total = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

  return sequelize.transaction(async (t) => {
    const notaPedido = await NotaPedido.create(
      {
        usuario_id, estado: "pendiente", estado_pago: "pendiente", monto_pagado: 0, notas, total,
        cuit: perfil.cuit, razon_social: perfil.razon_social, condicion_iva: perfil.condicion_iva,
        direccion: perfil.direccion, provincia: perfil.provincia, localidad: perfil.localidad,
        fecha_alta: new Date(), fecha_mod: new Date(),
      },
      { transaction: t }
    );

    await NotaPedidoItem.bulkCreate(
      items.map((i) => ({
        nota_pedido_id: notaPedido.id,
        producto_id: i.producto_id,
        variedad_id: null, // no viaja en el shape mapeado — no hace falta para el snapshot
        nombre_producto: i.nombre,
        variedad_nombre: i.variante,
        precio_unitario: i.precio,
        cantidad: i.cantidad,
        subtotal: i.precio * i.cantidad,
      })),
      { transaction: t }
    );

    return notaPedido;
  }).then(async (notaPedido) => {
    await vaciarCarrito(usuario_id);
    return notaPedido;
  });
}

export async function listarPropias(usuario_id) {
  return NotaPedido.findAll({
    where: { usuario_id },
    order: [["fecha_alta", "DESC"]],
    include: [{ model: NotaPedidoItem, as: "items" }, INCLUDE_PAGOS],
  });
}

export async function listarTodas() {
  return NotaPedido.findAll({
    order: [["fecha_alta", "DESC"]],
    include: [
      { model: NotaPedidoItem, as: "items" },
      INCLUDE_PAGOS,
      {
        model: Usuario, as: "usuario", attributes: ["id"],
        include: [{ model: Persona, as: "persona", attributes: ["nombre", "apellido", "email"] }],
      },
    ],
  });
}

/** Detalle completo de un pedido para el export a Excel. */
export async function obtenerDetalle(id) {
  return NotaPedido.findByPk(id, {
    include: [
      { model: NotaPedidoItem, as: "items" },
      {
        model: Usuario, as: "usuario", attributes: ["id"],
        include: [{ model: Persona, as: "persona", attributes: ["nombre", "apellido", "email"] }],
      },
    ],
  });
}

export async function cambiarEstado(id, estado) {
  const nota = await NotaPedido.findByPk(id);
  if (!nota) return null;

  if (ESTADOS_QUE_REQUIEREN_PAGO.includes(estado) && nota.estado_pago === "pendiente") {
    throw Object.assign(
      new Error("Este pedido no tiene ningún pago registrado — registrá al menos un pago antes de avanzarlo"),
      { status: 409, codigo: "REQUIERE_PAGO" }
    );
  }

  await nota.update({ estado, fecha_mod: new Date() });
  return nota;
}

/** Registra un pago (total o parcial) y recalcula el agregado del pedido. */
export async function registrarPago(nota_pedido_id, { monto, nota: notaTexto = null, usuario_id }) {
  const montoNum = Number(monto);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw Object.assign(new Error("El monto debe ser mayor a cero"), { status: 400 });
  }

  return sequelize.transaction(async (t) => {
    // Lock de fila — dos pagos concurrentes sobre el mismo pedido deben
    // serializarse, si no ambos podrían validar el saldo contra el mismo
    // monto_pagado desactualizado y juntos superar el total.
    const notaPedido = await NotaPedido.findByPk(nota_pedido_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!notaPedido) return null;

    const saldoPendiente = Number(notaPedido.total) - Number(notaPedido.monto_pagado);
    if (montoNum > saldoPendiente) {
      throw Object.assign(
        new Error(`El monto supera el saldo pendiente ($${saldoPendiente.toFixed(2)})`),
        { status: 400 }
      );
    }

    await NotaPedidoPago.create(
      { nota_pedido_id, monto: montoNum, nota: notaTexto, registrado_por: usuario_id ?? null, registrado_en: new Date() },
      { transaction: t }
    );

    return recomputarEstadoPago(nota_pedido_id, t);
  });
}

/**
 * Anula un pago sin borrarlo (queda el rastro de quién y cuándo). Si
 * anularlo dejaría al pedido en $0 pagado mientras sigue en un estado que
 * requiere pago (en_curso/entregado), se bloquea — primero hay que revertir
 * el estado a "pendiente" o "cancelada".
 */
export async function anularPago(pago_id, usuario_id) {
  return sequelize.transaction(async (t) => {
    const pago = await NotaPedidoPago.findByPk(pago_id, { transaction: t });
    if (!pago) return null;
    if (pago.anulado_en) return pago; // ya estaba anulado, no-op

    const notaPedido = await NotaPedido.findByPk(pago.nota_pedido_id, { transaction: t });
    const montoSinEstePago = Number(notaPedido.monto_pagado) - Number(pago.monto);

    if (montoSinEstePago <= 0 && ESTADOS_QUE_REQUIEREN_PAGO.includes(notaPedido.estado)) {
      throw Object.assign(
        new Error("Revertí el estado del pedido a Pendiente antes de anular este pago"),
        { status: 409, codigo: "REQUIERE_REVERTIR_ESTADO" }
      );
    }

    await pago.update({ anulado_por: usuario_id ?? null, anulado_en: new Date() }, { transaction: t });
    await recomputarEstadoPago(pago.nota_pedido_id, t);
    return pago;
  });
}
