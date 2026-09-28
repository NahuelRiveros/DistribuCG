import * as balance from "./balance_servicio.js";
import * as caja from "./caja_servicio.js";
import { escribirExcelCaja } from "./exportar_caja.js";

export async function anual(req, res) {
  res.json({ ok: true, data: await balance.balanceAnual(req.datos.query.anio) });
}

export async function mes(req, res) {
  res.json({ ok: true, data: await balance.balanceMes(req.datos.query) });
}

export async function movimientos(req, res) {
  const data = await balance.listarMovimientos(req.datos.query);
  res.json({ ok: true, data: data.movimientos, paginacion: data.paginacion });
}

export async function crearMovimiento(req, res) {
  res.status(201).json({ ok: true, data: await caja.crearMovimiento(req.usuario, req.datos.body) });
}

export async function editarMovimiento(req, res) {
  res.json({ ok: true, data: await caja.editarMovimiento(req.usuario, req.datos.params.id, req.datos.body) });
}

export async function anularMovimiento(req, res) {
  res.json({ ok: true, data: await caja.anularMovimiento(req.usuario, req.datos.params.id, req.datos.body) });
}

export async function categorias(_req, res) {
  res.json({ ok: true, data: await caja.listarCategorias() });
}

export async function crearCategoria(req, res) {
  res.status(201).json({ ok: true, data: await caja.crearCategoria(req.datos.body) });
}

export async function editarCategoria(req, res) {
  res.json({ ok: true, data: await caja.editarCategoria(req.datos.params.id, req.datos.body) });
}

export async function exportar(req, res) {
  const { anio } = req.datos.query;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="caja-${anio}.xlsx"`);
  await escribirExcelCaja(anio, res);
  res.end();
}
