import { Router } from "express";
import {
  listarPlanesController,
  obtenerPlanPorIdController,
  crearPlanController,
  actualizarPlanController,
  cambiarEstadoPlanController,
} from "../controllers/planes_controllers.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";

export const planesRouter = Router();

// Lectura: admin y staff
planesRouter.get("/",    requireAuth, requireRole("admin", "staff"), listarPlanesController);
planesRouter.get("/:id", requireAuth, requireRole("admin", "staff"), obtenerPlanPorIdController);

// Escritura: solo admin
planesRouter.post("/",           requireAuth, requireRole("admin"), crearPlanController);
planesRouter.put("/:id",         requireAuth, requireRole("admin"), actualizarPlanController);
planesRouter.patch("/:id/estado",requireAuth, requireRole("admin"), cambiarEstadoPlanController);