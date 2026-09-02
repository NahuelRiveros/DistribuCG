import { Router } from "express";
import {
  listarCategoriasController, crearCategoriaController, actualizarCategoriaController, eliminarCategoriaController,
} from "../../controllers/distribuidora/catalogos_distribuidora_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const catalogosDistribuidoraRouter = Router();
catalogosDistribuidoraRouter.use(requireModuloHabilitado("eccomerce_distribuidora"));

// A diferencia de indumentaria, acá el GET también requiere login — el
// catálogo entero es solo para clientes logueados (decisión de negocio).
catalogosDistribuidoraRouter.get("/categorias", requireAuth, listarCategoriasController);
catalogosDistribuidoraRouter.post("/categorias", requireAuth, requireRole("admin", "staff"), crearCategoriaController);
catalogosDistribuidoraRouter.put("/categorias/:id", requireAuth, requireRole("admin", "staff"), actualizarCategoriaController);
catalogosDistribuidoraRouter.delete("/categorias/:id", requireAuth, requireRole("admin", "staff"), eliminarCategoriaController);
