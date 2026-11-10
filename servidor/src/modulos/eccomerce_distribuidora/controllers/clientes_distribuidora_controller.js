import { listarClientes } from "../services/clientes_distribuidora_service.js";

export async function listarClientesController(req, res) {
  try {
    return res.json({ ok: true, ...await listarClientes(req.query) });
  } catch (error) {
    console.error("Error al listar clientes:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudo cargar el listado de clientes" });
  }
}
