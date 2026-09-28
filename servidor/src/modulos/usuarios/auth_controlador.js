import { iniciarSesion, obtenerPerfil, registrarCliente } from "./auth_servicio.js";

export async function registro(req, res) {
  const data = await registrarCliente(req.datos.body);
  res.status(201).json({ ok: true, data });
}

export async function login(req, res) {
  const data = await iniciarSesion(req.datos.body);
  res.json({ ok: true, data });
}

export async function yo(req, res) {
  const data = await obtenerPerfil(req.usuario.id);
  res.json({ ok: true, data });
}
