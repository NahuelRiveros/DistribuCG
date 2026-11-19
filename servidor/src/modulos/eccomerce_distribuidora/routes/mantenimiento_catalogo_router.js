import { Router } from "express";
import { requireAuth, requireRole } from "../../../core/middleware/auth_middleware.js";
import { clientConfig } from "../../../../../proyecto/client_config.js";
import { estadoCatalogoController, copiaCatalogoController, limpiarCatalogoController, cargarLoteController } from "../controllers/mantenimiento_catalogo_controller.js";

// CAT-60: con el mantenimiento apagado en la configuración, estas rutas no existen para nadie.
// CAT-52: encendido, borrar y recargar el catálogo es solo del super admin (ningún permiso del panel lo habilita).
export const mantenimientoCatalogoRouter = Router();
mantenimientoCatalogoRouter.use((_req, res, next) => clientConfig.tienda?.mantenimientoCatalogo === true ? next()
  : res.status(404).json({ ok: false, mensaje: "El mantenimiento del catálogo está desactivado." }));
mantenimientoCatalogoRouter.use(requireAuth, requireRole("super_admin"));
mantenimientoCatalogoRouter.get("/catalogo", estadoCatalogoController);
mantenimientoCatalogoRouter.get("/catalogo/copia", copiaCatalogoController);
mantenimientoCatalogoRouter.post("/catalogo/limpiar", limpiarCatalogoController);
mantenimientoCatalogoRouter.post("/catalogo/cargar", cargarLoteController);
