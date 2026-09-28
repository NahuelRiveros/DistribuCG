import { tieneRol } from "../../nucleo/auth/middlewares.js";
import { GESTORES_CATALOGO } from "./permisos.js";
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias } from "./categoria_servicio.js";

export async function listar(req, res) {
  const data = await listarCategorias({ soloVisibles: !tieneRol(req.usuario, GESTORES_CATALOGO) });
  res.json({ ok: true, data });
}

export async function crear(req, res) {
  const data = await crearCategoria(req.datos.body);
  res.status(201).json({ ok: true, data });
}

export async function actualizar(req, res) {
  const data = await actualizarCategoria(req.datos.params.id, req.datos.body);
  res.json({ ok: true, data });
}

export async function eliminar(req, res) {
  await eliminarCategoria(req.datos.params.id);
  res.status(204).end();
}
