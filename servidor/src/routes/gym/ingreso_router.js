import { Router } from "express";
import { registrarIngreso, estadoColaOfflineController } from "../../controllers/gym/ingreso_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const ingresoRouter = Router();

ingresoRouter.use(requireAuth, requireModuloHabilitado("gym"), requireRole("staff", "admin", "profesional"));

// Registrar ingreso por DNI (soporta modo offline automáticamente)
ingresoRouter.post("/registrar", registrarIngreso);

// Estado de la cola offline — útil para el Launcher y diagnóstico
ingresoRouter.get("/cola-offline", estadoColaOfflineController);
