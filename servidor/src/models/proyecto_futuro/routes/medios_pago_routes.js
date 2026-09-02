import { Router } from "express";
import { obtenerMediosPago, actualizarMediosPago } from "../controllers/medios_pago_controller.js";
import { requireAuth, requireNivel } from "../middleware/auth_middleware.js";
import { NIVELES } from "./access_roles.js";

export const mediosPagoRouter = Router();

mediosPagoRouter.get("/",  obtenerMediosPago);
mediosPagoRouter.put("/",  requireAuth, requireNivel(NIVELES.ADMIN), actualizarMediosPago);
