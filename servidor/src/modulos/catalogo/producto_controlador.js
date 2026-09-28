import { tieneRol } from "../../nucleo/auth/middlewares.js";
import { GESTORES_CATALOGO } from "./permisos.js";
import {
  actualizarProducto,
  cambiarEstadoProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerProducto,
} from "./producto_servicio.js";

// admin/staff ven también lo inactivo o sin publicar; el resto, solo lo que está a la venta.
const esPublico = (req) => !tieneRol(req.usuario, GESTORES_CATALOGO);

export async function listar(req, res) {
  const { data, paginacion } = await listarProductos(req.datos.query, { publico: esPublico(req) });
  res.json({ ok: true, data, paginacion });
}

export async function obtener(req, res) {
  const data = await obtenerProducto(req.datos.params.clave, { publico: esPublico(req) });
  res.json({ ok: true, data });
}

export async function crear(req, res) {
  const data = await crearProducto(req.datos.body);
  res.status(201).json({ ok: true, data });
}

export async function actualizar(req, res) {
  const data = await actualizarProducto(req.datos.params.id, req.datos.body);
  res.json({ ok: true, data });
}

export async function cambiarEstado(req, res) {
  const data = await cambiarEstadoProducto(req.datos.params.id, req.datos.body);
  res.json({ ok: true, data });
}

export async function eliminar(req, res) {
  await eliminarProducto(req.datos.params.id);
  res.status(204).end();
}
