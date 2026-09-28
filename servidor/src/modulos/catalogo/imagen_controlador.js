import { agregarImagenArchivo, agregarImagenUrl, eliminarImagen, ordenarImagenes } from "./imagen_servicio.js";

export async function subir(req, res) {
  const alt = typeof req.body?.alt === "string" && req.body.alt.trim() ? req.body.alt.trim().slice(0, 150) : null;
  const data = await agregarImagenArchivo(req.datos.params.id, req.file, { alt });
  res.status(201).json({ ok: true, data });
}

export async function agregarPorUrl(req, res) {
  const data = await agregarImagenUrl(req.datos.params.id, req.datos.body);
  res.status(201).json({ ok: true, data });
}

export async function eliminar(req, res) {
  await eliminarImagen(req.datos.params.id, req.datos.params.imagenId);
  res.status(204).end();
}

export async function ordenar(req, res) {
  const data = await ordenarImagenes(req.datos.params.id, req.datos.body.ids);
  res.json({ ok: true, data });
}
