// =============================================================
// routes/ordenes_routes.js
// =============================================================

import { Router } from "express";

import {
  crearOrden,
  getMisOrdenes,
  getOrden,
  cancelarOrden,
  getTodasOrdenes,
  actualizarEstadoOrden,
} from "../controllers/ordenes_controller.js";

import { requireAuth, requireRole, requireNivel } from "../middleware/auth_middleware.js";
import { ACCESS, NIVELES } from "./access_roles.js";

export const ordenesRouter = Router();

// Todas las rutas de órdenes requieren autenticación
ordenesRouter.use(requireAuth);

// =============================================================
// USUARIO — opera sobre sus propias órdenes
// POST   /ordenes                → crear orden desde carrito
// GET    /ordenes                → historial propio (?page=1&limit=10)
// GET    /ordenes/:id            → detalle de una orden
// PUT    /ordenes/:id/cancelar   → cancelar si está "pendiente"
// =============================================================

ordenesRouter.post( "/",               requireNivel(NIVELES.USR),   crearOrden);
ordenesRouter.get(  "/",               requireNivel(NIVELES.USR),   getMisOrdenes);
ordenesRouter.get(  "/:id",            requireNivel(NIVELES.USR),   getOrden);
ordenesRouter.put(  "/:id/cancelar",   requireNivel(NIVELES.USR),   cancelarOrden);

// =============================================================
// ADMIN — gestión completa
// GET /ordenes/admin/todas            → todas las órdenes (?estado=pendiente)
// PUT /ordenes/admin/:id/estado       → cambiar estado
// =============================================================

// IMPORTANTE: la ruta /admin/todas debe ir ANTES de /:id
// para que Express no interprete "admin" como un :id
ordenesRouter.get("/admin/todas",       requireNivel(NIVELES.ADMIN), getTodasOrdenes);
ordenesRouter.put("/admin/:id/estado",  requireNivel(NIVELES.ADMIN), actualizarEstadoOrden);
