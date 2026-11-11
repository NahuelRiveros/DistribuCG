import { Router } from "express";
import { listarClientesController } from "../controllers/clientes_distribuidora_controller.js";
import { requireAuth, requirePermiso } from "../../../core/middleware/auth_middleware.js";

export const clientesDistribuidoraRouter = Router();
clientesDistribuidoraRouter.use(requireAuth);

// CLI-14: junta DNI, celular y domicilio de todos los clientes; por eso pide un permiso propio.
clientesDistribuidoraRouter.get("/", requirePermiso("clientes.ver"), listarClientesController);
