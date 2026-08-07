import { Router } from "express";
import {
  listarPlanesController,
  obtenerPlanPorIdController,
  crearPlanController,
  actualizarPlanController,
  cambiarEstadoPlanController,
} from "../controllers/planes_controller.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../middleware/modulo_middleware.js";

export const planesRouter = Router();
planesRouter.use(requireModuloHabilitado("gym"));

// Lectura: admin y staff
planesRouter.get("/",    requireAuth, requireRole("admin", "staff", "kinesiologo"), listarPlanesController);
planesRouter.get("/:id", requireAuth, requireRole("admin", "staff", "kinesiologo"), obtenerPlanPorIdController);

// Escritura: solo admin
planesRouter.post("/",           requireAuth, requireRole("admin"), crearPlanController);
planesRouter.put("/:id",         requireAuth, requireRole("admin"), actualizarPlanController);
planesRouter.patch("/:id/estado",requireAuth, requireRole("admin"), cambiarEstadoPlanController);