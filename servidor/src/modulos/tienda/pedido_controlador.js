import * as pedidos from "./pedido_servicio.js";
import * as cobros from "./cobro_servicio.js";

// Cliente
export const enviar = async (req, res) => res.status(201).json({ ok: true, data: await pedidos.enviarPedido(req.usuario.id, req.datos.body) });
export async function mios(req, res) {
  const { data, paginacion } = await pedidos.misPedidos(req.usuario.id, req.datos.query);
  res.json({ ok: true, data, paginacion });
}
export const ver = async (req, res) => res.json({ ok: true, data: await pedidos.obtenerPedido(req.datos.params.id, { usuario: req.usuario }) });

// Panel
export async function listar(req, res) {
  const { data, paginacion } = await pedidos.listarPedidos(req.datos.query);
  res.json({ ok: true, data, paginacion });
}
export const resumen = async (_req, res) => res.json({ ok: true, data: await pedidos.resumenPedidos() });
export const cambiarEstado = async (req, res) => res.json({ ok: true, data: await pedidos.cambiarEstado(req.datos.params.id, req.datos.body, req.usuario.id) });
export const registrarCobro = async (req, res) =>
  res.status(201).json({ ok: true, data: await cobros.registrarCobro(req.datos.params.id, req.datos.body, req.usuario.id) });
export const anularCobro = async (req, res) =>
  res.json({ ok: true, data: await cobros.anularCobro(req.datos.params.id, req.datos.params.cobroId, req.datos.body, req.usuario.id) });
