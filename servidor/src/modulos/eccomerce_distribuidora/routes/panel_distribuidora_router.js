import { Router } from "express";
import { resumenPanelController } from "../controllers/panel_distribuidora_controller.js";
import { CODIGOS_PERMISO } from "../../../../../core/permisos_config.js";
import { requireAuth, requirePermiso } from "../../../core/middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../../core/middleware/modulo_middleware.js";

export const panelDistribuidoraRouter = Router();
panelDistribuidoraRouter.use(requireModuloHabilitado("eccomerce_distribuidora"));
panelDistribuidoraRouter.use(requireAuth);

// Entra quien tenga algún permiso del personal; cada sección se filtra además por permiso en el servicio.
panelDistribuidoraRouter.get("/resumen", requirePermiso(...CODIGOS_PERMISO), resumenPanelController);
