import { Router } from "express";
import { obtenerWhatsappConfig, actualizarWhatsappConfig } from "../controllers/whatsapp_config_controller.js";
import { requireAuth, requireNivel } from "../middleware/auth_middleware.js";
import { NIVELES } from "./access_roles.js";

export const whatsappConfigRouter = Router();

whatsappConfigRouter.get("/",  obtenerWhatsappConfig);
whatsappConfigRouter.put("/",  requireAuth, requireNivel(NIVELES.ADMIN), actualizarWhatsappConfig);
