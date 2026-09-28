import * as servicio from "./usuario_servicio.js";

export async function listar(req, res) {
  const data = await servicio.listarUsuarios(req.usuario, req.datos.query);
  res.json({ ok: true, data: data.usuarios, paginacion: data.paginacion });
}

export async function crear(req, res) {
  const data = await servicio.crearUsuario(req.usuario, req.datos.body);
  res.status(201).json({ ok: true, data });
}

export async function editar(req, res) {
  const data = await servicio.editarUsuario(req.usuario, req.datos.params.id, req.datos.body);
  res.json({ ok: true, data });
}

export async function cambiarEstado(req, res) {
  const data = await servicio.cambiarEstadoUsuario(req.usuario, req.datos.params.id, req.datos.body);
  res.json({ ok: true, data });
}

export async function cambiarContrasena(req, res) {
  const data = await servicio.cambiarContrasenaUsuario(req.usuario, req.datos.params.id, req.datos.body);
  res.json({ ok: true, data });
}
