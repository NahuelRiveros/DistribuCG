import { Router } from "express";
import {
  fusionarCarritoController, obtenerCarritoController, agregarItemController,
  actualizarCantidadController, eliminarItemController, vaciarCarritoController,
} from "../controllers/carrito_distribuidora_controller.js";
import { requireAuth } from "../../../core/middleware/auth_middleware.js";

export const carritoDistribuidoraRouter = Router();
carritoDistribuidoraRouter.use(requireAuth); // cualquier usuario logueado, sin rol específico

carritoDistribuidoraRouter.post("/merge", fusionarCarritoController);
carritoDistribuidoraRouter.get("/", obtenerCarritoController);
carritoDistribuidoraRouter.post("/items", agregarItemController);
carritoDistribuidoraRouter.put("/items/:itemId", actualizarCantidadController);
carritoDistribuidoraRouter.delete("/items/:itemId", eliminarItemController);
carritoDistribuidoraRouter.delete("/", vaciarCarritoController);
