// =============================================================
// routes/pagos_routes.js
//
// /pagos/webhook → PÚBLICO (lo llama MercadoPago)
// /pagos/verificar → autenticado (lo llama el frontend)
// =============================================================

import { Router } from "express";

import { webhookMP, verificarPago } from "../controllers/pagos_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { ACCESS } from "./access_roles.js";

export const pagosRouter = Router();

// =============================================================
// POST /pagos/webhook
// Notificación de MercadoPago — sin auth, IP de MP
// Responde 200 de inmediato para evitar reintentos
// =============================================================

pagosRouter.post("/webhook", webhookMP);

// =============================================================
// GET /pagos/verificar?payment_id=xxx
// El frontend consulta el estado de un pago tras volver de MP
// =============================================================

pagosRouter.get("/verificar", requireAuth, requireRole(...ACCESS.PAGOS_VERIFICAR), verificarPago);
