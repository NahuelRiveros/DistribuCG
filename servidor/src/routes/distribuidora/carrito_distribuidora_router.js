import { Router } from "express";
import {
  obtenerCarritoController, agregarItemController,
  actualizarCantidadController, eliminarItemController, vaciarCarritoController,
} from "../../controllers/distribuidora/carrito_distribuidora_controller.js";
import { requireAuth } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const carritoDistribuidoraRouter = Router();
carritoDistribuidoraRouter.use(requireModuloHabilitado("eccomerce_distribuidora"));
carritoDistribuidoraRouter.use(requireAuth); // cualquier usuario logueado, sin rol específico

carritoDistribuidoraRouter.get("/", obtenerCarritoController);
carritoDistribuidoraRouter.post("/items", agregarItemController);
carritoDistribuidoraRouter.put("/items/:itemId", actualizarCantidadController);
carritoDistribuidoraRouter.delete("/items/:itemId", eliminarItemController);
carritoDistribuidoraRouter.delete("/", vaciarCarritoController);
