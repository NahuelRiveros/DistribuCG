import { sequelize } from "../../database/sequelize.js";
import { NotaPedido, NotaPedidoItem, Persona, Usuario } from "../../models/index.js";
import { obtenerOCrearCarrito, listarItemsCarrito, vaciarCarrito } from "./carrito_distribuidora_service.js";
import { obtenerPerfil, perfilCompleto } from "./perfil_cliente_service.js";

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
        usuario_id, estado: "pendiente", notas, total,
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
    include: [{ model: NotaPedidoItem, as: "items" }],
  });
}

export async function listarTodas() {
  return NotaPedido.findAll({
    order: [["fecha_alta", "DESC"]],
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
  await nota.update({ estado, fecha_mod: new Date() });
  return nota;
}

export async function cambiarPago(id, pagado) {
  const nota = await NotaPedido.findByPk(id);
  if (!nota) return null;
  await nota.update({ pagado, fecha_mod: new Date() });
  return nota;
}
