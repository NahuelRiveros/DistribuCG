import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import {
  estadoModulos,
  listaModulosNegocio,
  actualizarModuloNegocioController,
} from "../controllers/modulos_controller.js";

export const modulosRouter = Router();

// Cualquier rol autenticado — lo usa el frontend para nav/footer.
modulosRouter.get("/estado", requireAuth, estadoModulos);

// Solo super_admin — pantalla de gestión de módulos.
modulosRouter.get("/", requireAuth, requireRole("super_admin"), listaModulosNegocio);
modulosRouter.patch("/:codigo/estado", requireAuth, requireRole("super_admin"), actualizarModuloNegocioController);
