import { Router } from "express";
import {
  obtenerCarritoController, agregarItemController,
  actualizarCantidadController, eliminarItemController, vaciarCarritoController,
} from "../../controllers/carrito/carrito_controller.js";
import { requireAuth } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const carritoRouter = Router();
carritoRouter.use(requireModuloHabilitado("eccomerce_indumentaria"));
carritoRouter.use(requireAuth); // cualquier usuario logueado, sin rol específico

carritoRouter.get("/", obtenerCarritoController);
carritoRouter.post("/items", agregarItemController);
carritoRouter.put("/items/:itemId", actualizarCantidadController);
carritoRouter.delete("/items/:itemId", eliminarItemController);
carritoRouter.delete("/", vaciarCarritoController);
