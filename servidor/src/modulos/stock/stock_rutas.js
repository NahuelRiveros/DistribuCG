import { Router } from "express";
import { idParams } from "compartido/schemas/comunes.js";
import { ajusteSchema, configurarStockSchema, existenciasQuery, ingresoSchema, movimientosQuery } from "compartido/schemas/stock.js";
import { requerirAuth, requerirModulo, requerirRol } from "../../nucleo/auth/middlewares.js";
import { validar } from "../../nucleo/validar.js";
import * as stock from "./stock_controlador.js";

// Todo el stock es del panel: admin y staff (super_admin pasa siempre). Cada movimiento guarda quién lo hizo.
export const stockRutas = Router();
stockRutas.use(requerirModulo("stock"), requerirAuth, requerirRol("admin", "staff"));

stockRutas.get("/existencias", validar({ query: existenciasQuery }), stock.existencias);
stockRutas.get("/resumen", stock.resumen);
stockRutas.get("/conciliacion", stock.conciliacion);
stockRutas.get("/variantes/:id/movimientos", validar({ params: idParams, query: movimientosQuery }), stock.historial);
stockRutas.patch("/variantes/:id", validar({ params: idParams, body: configurarStockSchema }), stock.configurar);
stockRutas.post("/ingresos", validar({ body: ingresoSchema }), stock.ingreso);
stockRutas.post("/ajustes", validar({ body: ajusteSchema }), stock.ajuste);
