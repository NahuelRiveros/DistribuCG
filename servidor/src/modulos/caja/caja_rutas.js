import { Router } from "express";
import { idParams } from "compartido/schemas/comunes.js";
import {
  anualQuery,
  anularMovimientoSchema,
  categoriaCajaEditarSchema,
  categoriaCajaSchema,
  exportarCajaQuery,
  mesQuery,
  movimientoCajaSchema,
  movimientosCajaQuery,
} from "compartido/schemas/caja.js";
import { requerirAuth, requerirModulo, requerirRol } from "../../nucleo/auth/middlewares.js";
import { validar } from "../../nucleo/validar.js";
import * as caja from "./caja_controlador.js";

// Caja (/api/caja): solo admin (y super_admin, que pasa cualquier rol). El personal no la ve.
export const cajaRutas = Router();
cajaRutas.use(requerirModulo("caja"), requerirAuth, requerirRol("admin"));

cajaRutas.get("/anual", validar({ query: anualQuery }), caja.anual);
cajaRutas.get("/mes", validar({ query: mesQuery }), caja.mes);
cajaRutas.get("/exportar", validar({ query: exportarCajaQuery }), caja.exportar);

cajaRutas.get("/movimientos", validar({ query: movimientosCajaQuery }), caja.movimientos);
cajaRutas.post("/movimientos", validar({ body: movimientoCajaSchema }), caja.crearMovimiento);
cajaRutas.patch("/movimientos/:id", validar({ params: idParams, body: movimientoCajaSchema }), caja.editarMovimiento);
cajaRutas.post("/movimientos/:id/anular", validar({ params: idParams, body: anularMovimientoSchema }), caja.anularMovimiento);

cajaRutas.get("/categorias", caja.categorias);
cajaRutas.post("/categorias", validar({ body: categoriaCajaSchema }), caja.crearCategoria);
cajaRutas.patch("/categorias/:id", validar({ params: idParams, body: categoriaCajaEditarSchema }), caja.editarCategoria);
