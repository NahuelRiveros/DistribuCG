import { Router } from "express";
import { listarClientesController } from "../controllers/clientes_distribuidora_controller.js";
import { requireAuth, requirePermiso } from "../../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../../middleware/modulo_middleware.js";

export const clientesDistribuidoraRouter = Router();
clientesDistribuidoraRouter.use(requireModuloHabilitado("eccomerce_distribuidora"));
clientesDistribuidoraRouter.use(requireAuth);

// CLI-14: junta DNI, celular y domicilio de todos los clientes; por eso pide un permiso propio.
clientesDistribuidoraRouter.get("/", requirePermiso("clientes.ver"), listarClientesController);
