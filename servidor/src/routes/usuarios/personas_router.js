import { Router } from "express";
import { registrar } from "../../controllers/usuarios/persona_controller.js";
import { requireAuth , requireRole } from "../../middleware/auth_middleware.js";

export const personasRouter = Router();
personasRouter.use(requireAuth,requireRole("staff","admin","profesional"));
personasRouter.post("/registrar", registrar);
