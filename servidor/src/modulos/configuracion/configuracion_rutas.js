import { Router } from "express";
import { z } from "compartido/zod.js";
import { pagosSchema } from "compartido/schemas/configuracion.js";
import { requerirAuth, requerirRol } from "../../nucleo/auth/middlewares.js";
import { validar } from "../../nucleo/validar.js";
import { cachePublico } from "../../nucleo/cache.js";
import * as configuracion from "./configuracion_controlador.js";

// /api/configuracion. Leer los pagos es público (la tienda los muestra); editarlos, solo admin.
export const configuracionRutas = Router();

const guardarPagosSchema = z.object({ valor: pagosSchema, version: z.string().nullable() });

configuracionRutas.get("/pagos", cachePublico({ segundos: 60, revalidar: 300 }), configuracion.pagos);
configuracionRutas.get("/pagos/editar", requerirAuth, requerirRol("admin"), configuracion.pagosParaEditar);
configuracionRutas.put("/pagos", requerirAuth, requerirRol("admin"), validar({ body: guardarPagosSchema }), configuracion.guardarPagos);
