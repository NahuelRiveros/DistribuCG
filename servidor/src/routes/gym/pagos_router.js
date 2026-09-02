import { Router } from "express";
import { requireAuth , requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";
import { registrarPago, previewPago } from "../../controllers/gym/pagos_controller.js";
export const pagosRouter = Router();

pagosRouter.use(requireAuth, requireModuloHabilitado("gym"), requireRole("staff","admin","profesional"));
pagosRouter.post("/registrar", registrarPago);
pagosRouter.get("/preview", previewPago); 