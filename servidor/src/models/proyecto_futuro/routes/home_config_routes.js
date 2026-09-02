import { Router } from "express";
import { obtenerHomeConfig, actualizarHomeConfig } from "../controllers/home_config_controller.js";
import { requireAuth, requireNivel } from "../middleware/auth_middleware.js";
import { NIVELES } from "./access_roles.js";

export const homeConfigRouter = Router();

homeConfigRouter.get("/",  obtenerHomeConfig);
homeConfigRouter.put("/",  requireAuth, requireNivel(NIVELES.ADMIN), actualizarHomeConfig);
