import { enviarEmailsMasivos } from "../services/email_service.js";
import { FILTROS, obtenerDestinatariosEmail, obtenerDestinatariosCelular } from "../services/promociones_service.js";

export async function previewController(req, res, next) {
  try {
    const filtro = req.query.filtro || "todos";
    if (!Object.prototype.hasOwnProperty.call(FILTROS, filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }
    const destinatarios = await obtenerDestinatariosEmail(filtro);
    return res.json({
      ok: true,
      total: destinatarios.length,
      muestra: destinatarios.slice(0, 5).map((d) => ({
        nombre: `${d.nombre} ${d.apellido}`,
        email:  d.email,
      })),
    });
  } catch (err) { next(err); }
}

export async function numerosController(req, res, next) {
  try {
    const filtro = req.query.filtro || "todos";
    if (!Object.prototype.hasOwnProperty.call(FILTROS, filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }
    const numeros = await obtenerDestinatariosCelular(filtro);
    return res.json({ ok: true, total: numeros.length, numeros });
  } catch (err) { next(err); }
}

export async function enviarController(req, res, next) {
  try {
    const { filtro = "todos", subject, html } = req.body ?? {};

    if (!subject?.trim() || !html?.trim())
      return res.status(400).json({ ok: false, mensaje: "Requerido: subject y html" });
    if (!Object.prototype.hasOwnProperty.call(FILTROS, filtro))
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });

    const destinatarios = await obtenerDestinatariosEmail(filtro);
    if (destinatarios.length === 0)
      return res.json({ ok: true, enviados: 0, fallidos: [], mensaje: "No hay destinatarios con email" });

    const lista = destinatarios.map((d) => ({
      email:  d.email,
      nombre: `${d.nombre} ${d.apellido}`.trim(),
    }));

    const resultado = await enviarEmailsMasivos({ destinatarios: lista, subject, html });

    return res.json({
      ok:       true,
      enviados: resultado.enviados,
      fallidos: resultado.fallidos,
      total:    resultado.total,
      mensaje:  `${resultado.enviados} email(s) enviados correctamente`,
    });
  } catch (err) {
    if (err.message?.includes("SMTP no configurado"))
      return res.status(400).json({ ok: false, mensaje: err.message });
    next(err);
  }
}
