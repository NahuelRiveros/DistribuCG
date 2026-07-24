import { Router } from "express";
import {
  RecaudacionMesesPorAnio,
  RecaudacionDiasDeMes,
  RecaudacionDetalleDia,
} from "../controllers/recaudacion_controller.js";

import { requireAuth , requireRole } from "../middleware/auth_middleware.js";


export const recaudacionRouter = Router();

recaudacionRouter.use(requireAuth,requireRole("admin"));
recaudacionRouter.get("/mensual", RecaudacionMesesPorAnio);
recaudacionRouter.get("/dias", RecaudacionDiasDeMes);
recaudacionRouter.get("/detalle-dia", RecaudacionDetalleDia);

