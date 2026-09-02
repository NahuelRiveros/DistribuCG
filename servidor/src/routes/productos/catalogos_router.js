import { Router } from "express";
import {
  listarCategoriasController, crearCategoriaController, actualizarCategoriaController, eliminarCategoriaController,
  listarMarcasController, crearMarcaController, actualizarMarcaController, eliminarMarcaController,
  listarTallesController, crearTalleController, actualizarTalleController, eliminarTalleController,
  listarColoresController, crearColorController, actualizarColorController, eliminarColorController,
  listarOpcionesEnvioController, crearOpcionEnvioController, actualizarOpcionEnvioController, eliminarOpcionEnvioController,
  listarCondicionesIvaController,
} from "../../controllers/productos/catalogos_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const catalogosRouter = Router();
catalogosRouter.use(requireModuloHabilitado("eccomerce_indumentaria"));

// Categorías, marcas, talles, colores — GET público (el catálogo los
// necesita sin login); escritura solo admin.
catalogosRouter.get("/categorias", listarCategoriasController);
catalogosRouter.post("/categorias", requireAuth, requireRole("admin"), crearCategoriaController);
catalogosRouter.put("/categorias/:id", requireAuth, requireRole("admin"), actualizarCategoriaController);
catalogosRouter.delete("/categorias/:id", requireAuth, requireRole("admin"), eliminarCategoriaController);

catalogosRouter.get("/marcas", listarMarcasController);
catalogosRouter.post("/marcas", requireAuth, requireRole("admin"), crearMarcaController);
catalogosRouter.put("/marcas/:id", requireAuth, requireRole("admin"), actualizarMarcaController);
catalogosRouter.delete("/marcas/:id", requireAuth, requireRole("admin"), eliminarMarcaController);

catalogosRouter.get("/talles", listarTallesController);
catalogosRouter.post("/talles", requireAuth, requireRole("admin"), crearTalleController);
catalogosRouter.put("/talles/:id", requireAuth, requireRole("admin"), actualizarTalleController);
catalogosRouter.delete("/talles/:id", requireAuth, requireRole("admin"), eliminarTalleController);

catalogosRouter.get("/colores", listarColoresController);
catalogosRouter.post("/colores", requireAuth, requireRole("admin"), crearColorController);
catalogosRouter.put("/colores/:id", requireAuth, requireRole("admin"), actualizarColorController);
catalogosRouter.delete("/colores/:id", requireAuth, requireRole("admin"), eliminarColorController);

// Opciones de envío / condición IVA — auth requerido para leer (se eligen
// en checkout, todavía no implementado — fase 2); escritura solo admin.
catalogosRouter.get("/opciones-envio", requireAuth, listarOpcionesEnvioController);
catalogosRouter.post("/opciones-envio", requireAuth, requireRole("admin"), crearOpcionEnvioController);
catalogosRouter.put("/opciones-envio/:id", requireAuth, requireRole("admin"), actualizarOpcionEnvioController);
catalogosRouter.delete("/opciones-envio/:id", requireAuth, requireRole("admin"), eliminarOpcionEnvioController);

catalogosRouter.get("/condiciones-iva", requireAuth, listarCondicionesIvaController);
