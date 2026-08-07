/**
 * consulta_publica_router.js
 *
 * Ruta pública — NO requiere auth.
 * Permite a cualquier persona consultar su plan por DNI.
 */

import { Router } from "express";
import { consultarPlanController } from "../../controllers/sistema/consulta_publica_controller.js";

export const consultaPublicaRouter = Router();

// GET /api/consulta/plan/:dni
consultaPublicaRouter.get("/plan/:dni", consultarPlanController);
