import { Router } from "express";
import {
  crearNotaPedidoController, listarMisNotasController, listarTodasController,
  cambiarEstadoController, registrarPagoController, anularPagoController,
  exportarNotaPedidoController,
} from "../../controllers/distribuidora/nota_pedido_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const notaPedidoRouter = Router();
notaPedidoRouter.use(requireModuloHabilitado("eccomerce_distribuidora"));
notaPedidoRouter.use(requireAuth);

// Ver/procesar TODOS los pedidos es "admin" + "vendedor" (no "staff" — a
// propósito separado de quien gestiona catálogo, ver seed_rbac.js).
const ROLES_VENTAS = ["admin", "vendedor"];

// Rutas específicas ANTES de "/:id".
notaPedidoRouter.get("/todas", requireRole(...ROLES_VENTAS), listarTodasController);

notaPedidoRouter.get("/", listarMisNotasController);
notaPedidoRouter.post("/", crearNotaPedidoController);
notaPedidoRouter.put("/:id/estado", requireRole(...ROLES_VENTAS), cambiarEstadoController);
notaPedidoRouter.get("/:id/export", requireRole(...ROLES_VENTAS), exportarNotaPedidoController);
notaPedidoRouter.post("/:id/pagos", requireRole(...ROLES_VENTAS), registrarPagoController);
notaPedidoRouter.post("/:id/pagos/:pagoId/anular", requireRole(...ROLES_VENTAS), anularPagoController);
