import * as stock from "./stock_servicio.js";

export async function existencias(req, res) {
  const { data, paginacion } = await stock.listarExistencias(req.datos.query);
  res.json({ ok: true, data, paginacion });
}

export async function resumen(_req, res) {
  res.json({ ok: true, data: await stock.resumenStock() });
}

export async function configurar(req, res) {
  res.json({ ok: true, data: await stock.configurarStock(req.datos.params.id, req.datos.body) });
}

export async function ingreso(req, res) {
  res.status(201).json({ ok: true, data: await stock.ingresarMercaderia(req.datos.body, req.usuario.id) });
}

export async function ajuste(req, res) {
  res.status(201).json({ ok: true, data: await stock.ajustarStock(req.datos.body, req.usuario.id) });
}

export async function historial(req, res) {
  const { existencia, data, paginacion } = await stock.historial(req.datos.params.id, req.datos.query);
  res.json({ ok: true, data, existencia, paginacion });
}

export async function conciliacion(_req, res) {
  const diferencias = await stock.conciliar();
  res.json({ ok: true, data: { correcto: diferencias.length === 0, diferencias } });
}
