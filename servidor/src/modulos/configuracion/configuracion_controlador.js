import * as servicio from "./configuracion_servicio.js";

export async function pagos(_req, res) {
  res.json({ ok: true, data: await servicio.obtenerPagos() });
}

export async function pagosParaEditar(_req, res) {
  res.json({ ok: true, data: await servicio.obtenerParaEditar("pagos") });
}

export async function guardarPagos(req, res) {
  res.json({ ok: true, data: await servicio.guardar(req.usuario, "pagos", req.datos.body) });
}
