import { Conf01Whatsapp } from "../models/index.js";
import { okResponse, errorResponse } from "../utils/api_response.js";

// ── GET /config/whatsapp  [público] ───────────────────────────────────────────

export async function obtenerWhatsappConfig(req, res) {
  try {
    let row = await Conf01Whatsapp.findOne();
    if (!row) {
      row = await Conf01Whatsapp.create({ CONF_JSON: {} });
    }
    return okResponse(res, { data: row.CONF_JSON, mensaje: "Configuración obtenida" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo obtener la configuración de WhatsApp", error });
  }
}

// ── PUT /config/whatsapp  [admin] ─────────────────────────────────────────────

export async function actualizarWhatsappConfig(req, res) {
  try {
    const datos = req.body;
    if (typeof datos !== "object" || datos === null) {
      return res.status(400).json({ ok: false, mensaje: "El body debe ser un objeto JSON" });
    }

    let row = await Conf01Whatsapp.findOne();
    if (!row) {
      row = await Conf01Whatsapp.create({ CONF_JSON: datos });
    } else {
      await row.update({ CONF_JSON: datos });
    }

    return okResponse(res, { data: row.CONF_JSON, mensaje: "Configuración de WhatsApp actualizada" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo guardar la configuración de WhatsApp", error });
  }
}
