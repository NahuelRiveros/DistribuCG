import { Conf02MediosPago } from "../models/index.js";
import { okResponse, errorResponse } from "../utils/api_response.js";

const DEFAULT_CONFIG = {
  habilitado: true,
  nota: "",
  // Logos de tarjetas bancarias — se muestran en los chips de cuotas
  tarjetasConfig: [
    { nombre: "Visa",             logo: "" },
    { nombre: "Mastercard",       logo: "" },
    { nombre: "Naranja X",        logo: "" },
    { nombre: "Cabal",            logo: "" },
    { nombre: "Banco Nación",     logo: "" },
    { nombre: "MODO",             logo: "" },
  ],
  metodos: [
    {
      id: "mercadopago",
      nombre: "Mercado Pago",
      logo: "",
      habilitado: true,
      descripcion: "Pagá con tu cuenta de Mercado Pago, tarjeta o dinero en cuenta.",
      cuotas: [],
    },
    {
      id: "tarjeta_credito",
      nombre: "Tarjeta de crédito",
      logo: "",
      habilitado: true,
      descripcion: "",
      cuotas: [
        { cantidad: 1,  sinInteres: true,  tarjetas: ["Visa", "Mastercard", "Naranja X", "Cabal"] },
        { cantidad: 3,  sinInteres: false, tarjetas: [] },
        { cantidad: 6,  sinInteres: false, tarjetas: [] },
        { cantidad: 12, sinInteres: false, tarjetas: [] },
      ],
    },
    {
      id: "go_cuotas",
      nombre: "Go Cuotas",
      logo: "",
      habilitado: false,
      descripcion: "Go Cuotas — hasta 3 cuotas. Consultá en el local.",
      cuotas: [
        { cantidad: 3, sinInteres: true, tarjetas: ["Banco Nación"] },
      ],
    },
    {
      id: "tarjeta_debito",
      nombre: "Tarjeta de débito",
      logo: "",
      habilitado: true,
      descripcion: "Débito sin recargo.",
      cuotas: [],
    },
    {
      id: "efectivo",
      nombre: "Efectivo",
      logo: "",
      habilitado: true,
      descripcion: "Pagá en el local con efectivo.",
      cuotas: [],
    },
  ],
};

// ── GET /config/medios-pago  [público] ────────────────────────────────────────

export async function obtenerMediosPago(req, res) {
  try {
    let row = await Conf02MediosPago.findOne();
    if (!row) {
      row = await Conf02MediosPago.create({ CONF_JSON: DEFAULT_CONFIG });
    }
    return okResponse(res, { data: row.CONF_JSON, mensaje: "Medios de pago obtenidos" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo obtener los medios de pago", error });
  }
}

// ── PUT /config/medios-pago  [admin] ──────────────────────────────────────────

export async function actualizarMediosPago(req, res) {
  try {
    const datos = req.body;
    if (typeof datos !== "object" || datos === null) {
      return res.status(400).json({ ok: false, mensaje: "El body debe ser un objeto JSON" });
    }

    let row = await Conf02MediosPago.findOne();
    if (!row) {
      row = await Conf02MediosPago.create({ CONF_JSON: datos });
    } else {
      await row.update({ CONF_JSON: datos });
    }

    return okResponse(res, { data: row.CONF_JSON, mensaje: "Medios de pago actualizados" });
  } catch (error) {
    return errorResponse(res, { mensaje: "No se pudo guardar los medios de pago", error });
  }
}
