import { Home01Config } from "../models/index.js";
import { okResponse, errorResponse } from "../utils/api_response.js";

// ── GET /home-config  [público] ───────────────────────────────────────────────

export async function obtenerHomeConfig(req, res) {
  try {
    let row = await Home01Config.findOne();
    if (!row) {
      row = await Home01Config.create({ CONF_JSON: {} });
    }
    return okResponse(res, { data: row.CONF_JSON, mensaje: "Configuración obtenida" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo obtener la configuración del home", error });
  }
}

// ── PUT /home-config  [admin] ─────────────────────────────────────────────────

export async function actualizarHomeConfig(req, res) {
  try {
    const datos = req.body;
    if (typeof datos !== "object" || datos === null) {
      return res.status(400).json({ ok: false, mensaje: "El body debe ser un objeto JSON" });
    }

    let row = await Home01Config.findOne();
    if (!row) {
      row = await Home01Config.create({ CONF_JSON: datos });
    } else {
      await row.update({ CONF_JSON: datos });
    }

    return okResponse(res, { data: row.CONF_JSON, mensaje: "Configuración actualizada correctamente" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo guardar la configuración del home", error });
  }
}
