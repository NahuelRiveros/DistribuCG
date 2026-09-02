import { crearNotaPedido, listarPropias, listarTodas, cambiarEstado, cambiarPago } from "../../services/distribuidora/nota_pedido_service.js";

export async function crearNotaPedidoController(req, res) {
  try {
    const { notas } = req.body ?? {};
    const nota = await crearNotaPedido(req.user.usuario_id, { notas });
    return res.status(201).json({ ok: true, mensaje: "Pedido enviado correctamente", data: nota });
  } catch (error) {
    console.error("Error al crear nota de pedido:", error);
    return res.status(error.status ?? 500).json({
      ok: false,
      codigo: error.codigo,
      mensaje: error.status ? error.message : "Error interno al enviar el pedido",
    });
  }
}

export async function listarMisNotasController(req, res) {
  try {
    return res.json({ ok: true, data: await listarPropias(req.user.usuario_id) });
  } catch (error) {
    console.error("Error al listar notas de pedido:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar los pedidos" });
  }
}

export async function listarTodasController(req, res) {
  try {
    return res.json({ ok: true, data: await listarTodas() });
  } catch (error) {
    console.error("Error al listar notas de pedido:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar los pedidos" });
  }
}

export async function cambiarEstadoController(req, res) {
  try {
    const { estado } = req.body ?? {};
    if (!["pendiente", "en_curso", "entregado", "cancelada"].includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: "estado inválido" });
    }
    const nota = await cambiarEstado(req.params.id, estado);
    if (!nota) return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    return res.json({ ok: true, mensaje: "Estado actualizado", data: nota });
  } catch (error) {
    console.error("Error al cambiar estado de nota de pedido:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el pedido" });
  }
}

export async function cambiarPagoController(req, res) {
  try {
    const { pagado } = req.body ?? {};
    if (typeof pagado !== "boolean") {
      return res.status(400).json({ ok: false, mensaje: "pagado debe ser true o false" });
    }
    const nota = await cambiarPago(req.params.id, pagado);
    if (!nota) return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    return res.json({ ok: true, mensaje: pagado ? "Marcado como pagado" : "Marcado como no pagado", data: nota });
  } catch (error) {
    console.error("Error al cambiar pago de nota de pedido:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el pedido" });
  }
}
