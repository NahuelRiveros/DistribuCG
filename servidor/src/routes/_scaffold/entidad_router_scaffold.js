/**
 * PLANTILLA — router: GET público (o no, ver TODO) + escritura solo admin.
 * Ver routes/productos/catalogos_router.js para un ejemplo real ya
 * funcionando con este mismo patrón.
 *
 * No se importa desde ningún lado — punto de partida para copiar.
 *
 * Cómo usarla:
 *   1. Copiá a `routes/<dominio>/mi_entidad_router.js`.
 *   2. Cambiá el import por tu controller real.
 *   3. Si el módulo entero se puede apagar por instalación (como gym o
 *      eccomerce_indumentaria), agregá `.use(requireModuloHabilitado("codigo"))` — si no,
 *      sacá esa línea.
 *   4. Registralo en `routes/index.js`:
 *        import { entidadRouter } from "./<dominio>/mi_entidad_router.js";
 *        router.use("/mi-entidad", entidadRouter);
 *      Ojo con el nombre del import si ya existe un router con el mismo
 *      nombre exportado en otro archivo — hay que alias-earlo (ver cómo
 *      `catalogosRouter` de productos/ se importa con alias en index.js,
 *      porque ya existía uno en sistema/).
 *   5. Si tenés rutas de path fijo (ej. "/stock-bajo") Y una ruta "/:id",
 *      las fijas van SIEMPRE antes que "/:id" — si no, Express interpreta
 *      "stock-bajo" como un id.
 */

import { Router } from "express";
import {
  listarEntidadesController, crearEntidadController,
  actualizarEntidadController, eliminarEntidadController,
} from "../../controllers/_scaffold/entidad_controller_scaffold.js"; // TODO: controller real
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
// import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js"; // TODO: si aplica

export const entidadRouter = Router();
// entidadRouter.use(requireModuloHabilitado("codigo")); // TODO: descomentar si aplica

// TODO: sacar requireAuth del GET si esta entidad es un catálogo público
// (el frontend la necesita sin login, como categorías/marcas/talles/colores)
entidadRouter.get("/", requireAuth, listarEntidadesController);
entidadRouter.post("/", requireAuth, requireRole("admin"), crearEntidadController);
entidadRouter.put("/:id", requireAuth, requireRole("admin"), actualizarEntidadController);
entidadRouter.delete("/:id", requireAuth, requireRole("admin"), eliminarEntidadController);
