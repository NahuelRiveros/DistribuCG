import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";
import { previewController, numerosController, enviarController } from "../../controllers/gym/promociones_controller.js";

export const promocionesRouter = Router();

promocionesRouter.use(requireAuth, requireModuloHabilitado("gym"), requireRole("admin"));

promocionesRouter.get("/preview", previewController);
promocionesRouter.get("/numeros", numerosController);
promocionesRouter.post("/enviar", enviarController);
