// =============================================================
// controllers/ordenes_controller.js
//
// Flujo principal de compra:
//   1. crearOrden   → valida carrito, genera orden + preferencia MP
//   2. (webhook)    → MP confirma pago → ver pagos_controller
//   3. getMisOrdenes / getOrden → historial del usuario
// =============================================================

import { sequelize } from "../database/sequelize.js";

import {
  Carr01Carrito,
  Carr02Item,
  Ord01Estado,
  Ord03Orden,
  Ord04Item,
  Envio01Opcion,
  Envio02Envio,
  Prod03Producto,
  Prod01Categoria,
  Auth02Usuario,
} from "../models/index.js";

import { crearPreferencia } from "../services/mercadopago_service.js";

import {
  okResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from "../utils/api_response.js";

import { sanitizarPaginacion, construirPaginacion } from "../utils/pagination.js";

// =============================================================
// Helper: obtiene el ID de un estado por código
// =============================================================

async function getEstadoId(codigo) {
  const estado = await Ord01Estado.findOne({ where: { ORD01_CODIGO: codigo } });
  if (!estado) throw new Error(`Estado de orden "${codigo}" no encontrado. Ejecutar seeds.`);
  return estado.ID_ORD01;
}

// =============================================================
// Helper: mapea una orden con sus items al shape del frontend
// =============================================================

function mapOrden(orden) {
  return {
    id:           orden.ID_ORD03,
    estado:       orden.estado?.ORD01_CODIGO   ?? null,
    estado_label: orden.estado?.ORD01_ETIQUETA ?? null,
    subtotal:     parseFloat(orden.ORD03_SUBTOTAL),
    costo_envio:  parseFloat(orden.ORD03_COSTO_ENVIO),
    total:        parseFloat(orden.ORD03_TOTAL),
    direccion:    orden.ORD03_DIRECCION,
    facturacion:  orden.ORD03_FACTURACION,
    mp_preference_id: orden.ORD03_MP_PREFERENCE_ID,
    mp_payment_id:    orden.ORD03_MP_PAYMENT_ID,
    notas:        orden.ORD03_NOTAS,
    fecha:        orden.ORD03_FECHAALTA,
    items: (orden.items ?? []).map((i) => ({
      id:            i.ID_ORD04,
      producto_id:   i.RELA_PROD03,
      nombre:        i.ORD04_NOMBRE,
      categoria:     i.ORD04_CATEGORIA,
      talle:         i.ORD04_TALLE,
      precio_unidad: parseFloat(i.ORD04_PRECIO_UNIDAD),
      cantidad:      i.ORD04_CANTIDAD,
      subtotal:      parseFloat(i.ORD04_SUBTOTAL),
    })),
    envio: orden.envio
      ? {
          estado:     orden.envio.ENVIO02_ESTADO,
          tracking:   orden.envio.ENVIO02_TRACKING,
          opcion:     orden.envio.opcion?.ENVIO01_NOMBRE ?? null,
        }
      : null,
  };
}

// include reutilizable para cargar una orden completa
const ORDEN_INCLUDE = [
  { model: Ord01Estado,   as: "estado",  attributes: ["ORD01_CODIGO", "ORD01_ETIQUETA"] },
  { model: Ord04Item,     as: "items" },
  {
    model: Envio02Envio, as: "envio",
    include: [{ model: Envio01Opcion, as: "opcion", attributes: ["ENVIO01_NOMBRE"] }],
  },
];

// =============================================================
// POST /ordenes
// Body:
//   {
//     envio_opcion_id: number,
//     codigo_postal:   string,
//     direccion:       { calle, numero, piso?, depto?, localidad, provincia },
//     facturacion?:    { razon_social?, cuit?, condicion_iva: "RI"|"CF"|"MT"|"EX" },
//     notas?:          string
//   }
// =============================================================

export async function crearOrden(req, res) {
  try {
    const usuarioId = req.user.ID_AUTH02;
    const { envio_opcion_id, codigo_postal, direccion, facturacion, notas } = req.body;

    // ── Validaciones básicas ──────────────────────────────────
    if (!envio_opcion_id || !codigo_postal || !direccion) {
      return badRequestResponse(res, {
        mensaje: "Faltan campos: envio_opcion_id, codigo_postal, direccion",
      });
    }
    if (!direccion.calle || !direccion.numero || !direccion.localidad || !direccion.provincia) {
      return badRequestResponse(res, {
        mensaje: "La dirección debe tener: calle, numero, localidad, provincia",
      });
    }

    // ── Carrito ───────────────────────────────────────────────
    const carrito = await Carr01Carrito.findOne({ where: { RELA_AUTH02: usuarioId } });
    if (!carrito) return badRequestResponse(res, { mensaje: "No tenés un carrito activo" });

    const cartItems = await Carr02Item.findAll({
      where:   { RELA_CARR01: carrito.ID_CARR01 },
      include: [{
        model:      Prod03Producto,
        as:         "producto",
        attributes: ["PROD03_NOMBRE", "PROD03_IMAGENES"],
        include:    [{ model: Prod01Categoria, as: "categoria", attributes: ["PROD01_NOMBRE"] }],
      }],
    });

    if (cartItems.length === 0) {
      return badRequestResponse(res, { mensaje: "El carrito está vacío" });
    }

    // ── Opción de envío ───────────────────────────────────────
    const opcionEnvio = await Envio01Opcion.findByPk(envio_opcion_id);
    if (!opcionEnvio || !opcionEnvio.ENVIO01_ACTIVO) {
      return badRequestResponse(res, { mensaje: "Opción de envío inválida" });
    }

    // ── Cálculos ──────────────────────────────────────────────
    const subtotal = cartItems.reduce(
      (sum, i) => sum + parseFloat(i.CARR02_PRECIO_UNIDAD) * i.CARR02_CANTIDAD, 0
    );

    const gradesDesde  = parseFloat(opcionEnvio.ENVIO01_GRATIS_DESDE ?? Infinity);
    const costoEnvio   = subtotal >= gradesDesde ? 0 : parseFloat(opcionEnvio.ENVIO01_PRECIO);
    const total        = subtotal + costoEnvio;

    // ── Usuario (para email en MP) ────────────────────────────
    const usuario = await Auth02Usuario.findByPk(usuarioId, {
      attributes: ["AUTH02_EMAIL", "AUTH02_NOMBRE"],
    });

    // ── Transacción: crear orden + items + envío ──────────────
    let nuevaOrden;

    await sequelize.transaction(async (t) => {
      const estadoPendienteId = await getEstadoId("pendiente");

      nuevaOrden = await Ord03Orden.create({
        RELA_AUTH02:      usuarioId,
        RELA_ORD01:       estadoPendienteId,
        ORD03_SUBTOTAL:   subtotal,
        ORD03_COSTO_ENVIO:costoEnvio,
        ORD03_TOTAL:      total,
        ORD03_DIRECCION:  direccion,
        ORD03_FACTURACION:facturacion ?? null,
        ORD03_NOTAS:      notas ?? null,
        ORD03_FECHAALTA:  new Date(),
        ORD03_FECHAMOD:   new Date(),
      }, { transaction: t });

      // Items de la orden (snapshots)
      for (const item of cartItems) {
        const precioUnidad = parseFloat(item.CARR02_PRECIO_UNIDAD);
        await Ord04Item.create({
          RELA_ORD03:          nuevaOrden.ID_ORD03,
          RELA_PROD03:         item.RELA_PROD03,
          ORD04_NOMBRE:        item.producto?.PROD03_NOMBRE    ?? "Producto",
          ORD04_CATEGORIA:     item.producto?.categoria?.PROD01_NOMBRE ?? "",
          ORD04_TALLE:         item.RELA_PROD04 ? null : null, // se resuelve abajo
          ORD04_PRECIO_UNIDAD: precioUnidad,
          ORD04_CANTIDAD:      item.CARR02_CANTIDAD,
          ORD04_SUBTOTAL:      precioUnidad * item.CARR02_CANTIDAD,
        }, { transaction: t });
      }

      // Registro de envío
      await Envio02Envio.create({
        RELA_ORD03:          nuevaOrden.ID_ORD03,
        RELA_ENVIO01:        envio_opcion_id,
        ENVIO02_ESTADO:      "pendiente",
        ENVIO02_CODIGO_POSTAL: codigo_postal,
        ENVIO02_FECHAALTA:   new Date(),
      }, { transaction: t });
    });

    // ── Preferencia MercadoPago (fuera de transacción) ────────
    let mpInitPoint = null;
    let mpPreferenceId = null;

    try {
      const mpItems = cartItems.map((i) => ({
        producto_id:  i.RELA_PROD03,
        nombre:       i.producto?.PROD03_NOMBRE ?? "Producto",
        cantidad:     i.CARR02_CANTIDAD,
        precio_unidad: parseFloat(i.CARR02_PRECIO_UNIDAD),
      }));

      const mp = await crearPreferencia({
        ordenId:   nuevaOrden.ID_ORD03,
        total,
        userEmail: usuario.AUTH02_EMAIL,
        items:     mpItems,
      });

      mpPreferenceId = mp.preference_id;
      mpInitPoint    = mp.init_point;

      await nuevaOrden.update({
        ORD03_MP_PREFERENCE_ID: mpPreferenceId,
        ORD03_FECHAMOD:         new Date(),
      });
    } catch (mpError) {
      // Si MP falla, la orden queda creada pero sin link de pago.
      // El admin puede reintentarlo desde el panel.
      console.error("[MP] Error al crear preferencia:", mpError.message);
    }

    return createdResponse(res, {
      data: {
        orden_id:      nuevaOrden.ID_ORD03,
        total,
        mp_init_point: mpInitPoint,
      },
      mensaje: mpInitPoint
        ? "Orden creada. Redirigiendo al pago."
        : "Orden creada. Error al generar link de pago — contactar soporte.",
    });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo crear la orden", error });
  }
}

// =============================================================
// GET /ordenes
// Historial de órdenes del usuario autenticado (paginado)
// ?page=1&limit=10
// =============================================================

export async function getMisOrdenes(req, res) {
  try {
    const usuarioId       = req.user.ID_AUTH02;
    const { page, limit, offset } = sanitizarPaginacion(req.query.page, req.query.limit);

    const { rows, count } = await Ord03Orden.findAndCountAll({
      where:    { RELA_AUTH02: usuarioId },
      include:  ORDEN_INCLUDE,
      order:    [["ORD03_FECHAALTA", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return okResponse(res, {
      data:       rows.map(mapOrden),
      pagination: construirPaginacion({ total: count, page, limit }),
      mensaje:    "Historial de órdenes obtenido correctamente",
    });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo obtener el historial de órdenes", error });
  }
}

// =============================================================
// GET /ordenes/:id
// Detalle de una orden — solo si pertenece al usuario (o es admin)
// =============================================================

export async function getOrden(req, res) {
  try {
    const usuarioId = req.user.ID_AUTH02;
    const { id }    = req.params;
    const esAdmin   = req.user.rol?.AUTH01_ABREVIATURA === "ADM";

    const where = { ID_ORD03: id };
    if (!esAdmin) where.RELA_AUTH02 = usuarioId;

    const orden = await Ord03Orden.findOne({ where, include: ORDEN_INCLUDE });

    if (!orden) return notFoundResponse(res, { mensaje: `Orden ${id} no encontrada` });

    return okResponse(res, { data: mapOrden(orden), mensaje: "Orden obtenida correctamente" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo obtener la orden", error });
  }
}

// =============================================================
// PUT /ordenes/:id/cancelar
// El usuario cancela una orden solo si está en estado "pendiente"
// =============================================================

export async function cancelarOrden(req, res) {
  try {
    const usuarioId = req.user.ID_AUTH02;
    const { id }    = req.params;

    const orden = await Ord03Orden.findOne({
      where:   { ID_ORD03: id, RELA_AUTH02: usuarioId },
      include: [{ model: Ord01Estado, as: "estado" }],
    });

    if (!orden) return notFoundResponse(res, { mensaje: `Orden ${id} no encontrada` });

    if (orden.estado?.ORD01_CODIGO !== "pendiente") {
      return badRequestResponse(res, {
        mensaje: `Solo podés cancelar órdenes en estado "pendiente". Estado actual: "${orden.estado?.ORD01_CODIGO}"`,
      });
    }

    const estadoCanceladoId = await getEstadoId("cancelado");
    await orden.update({ RELA_ORD01: estadoCanceladoId, ORD03_FECHAMOD: new Date() });

    return okResponse(res, { data: null, mensaje: "Orden cancelada correctamente" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo cancelar la orden", error });
  }
}

// =============================================================
// GET /ordenes/admin/todas  [Admin]
// Lista todas las órdenes con filtros por estado
// ?estado=pendiente&page=1&limit=20
// =============================================================

export async function getTodasOrdenes(req, res) {
  try {
    const { page, limit, offset } = sanitizarPaginacion(req.query.page, req.query.limit);

    const where = {};

    if (req.query.estado) {
      const estado = await Ord01Estado.findOne({ where: { ORD01_CODIGO: req.query.estado } });
      if (estado) where.RELA_ORD01 = estado.ID_ORD01;
    }

    const { rows, count } = await Ord03Orden.findAndCountAll({
      where,
      include:  ORDEN_INCLUDE,
      order:    [["ORD03_FECHAALTA", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return okResponse(res, {
      data:       rows.map(mapOrden),
      pagination: construirPaginacion({ total: count, page, limit }),
      mensaje:    "Órdenes obtenidas correctamente",
    });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo obtener las órdenes", error });
  }
}

// =============================================================
// PUT /ordenes/admin/:id/estado  [Admin]
// Body: { estado: "preparando" | "enviado" | "entregado" | ... }
// =============================================================

export async function actualizarEstadoOrden(req, res) {
  try {
    const { id }    = req.params;
    const { estado: codigoEstado } = req.body;

    if (!codigoEstado) {
      return badRequestResponse(res, { mensaje: "El campo 'estado' es requerido" });
    }

    const orden = await Ord03Orden.findByPk(id);
    if (!orden) return notFoundResponse(res, { mensaje: `Orden ${id} no encontrada` });

    const nuevoEstadoId = await getEstadoId(codigoEstado);
    await orden.update({ RELA_ORD01: nuevoEstadoId, ORD03_FECHAMOD: new Date() });

    // Si se marca como "enviado", actualizar también el registro de envío
    if (codigoEstado === "enviado") {
      await Envio02Envio.update(
        { ENVIO02_ESTADO: "despachado", ENVIO02_FECHA_DESPACHO: new Date() },
        { where: { RELA_ORD03: id } }
      );
    }
    if (codigoEstado === "entregado") {
      await Envio02Envio.update(
        { ENVIO02_ESTADO: "entregado", ENVIO02_FECHA_ENTREGA: new Date() },
        { where: { RELA_ORD03: id } }
      );
    }

    return okResponse(res, { data: null, mensaje: `Orden actualizada a "${codigoEstado}"` });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo actualizar el estado de la orden", error });
  }
}
