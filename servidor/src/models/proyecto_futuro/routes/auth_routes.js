// ==========================================================
// routes/auth_routes.js
//
// POST   /auth/login                     → iniciar sesión
// POST   /auth/register                  → registro público (siempre crea USR)
// GET    /auth/me                        → sesión actual [requireAuth]
// POST   /auth/logout                    → cerrar sesión  [requireAuth]
// PUT    /auth/cambiar-password          → cambiar propia contraseña [requireAuth]
// POST   /auth/forgot-password           → solicitar link de reset
// GET    /auth/verify-reset-token/:token → verificar si el token es válido (sin consumirlo)
// POST   /auth/reset-password            → aplicar nueva contraseña con token
// ==========================================================

import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
  loginController,
  meController,
  logoutController,
  registerController,
  forgotPasswordController,
  verificarResetTokenController,
  resetPasswordController,
  cambiarPasswordController,
} from "../controllers/auth_controller.js";

import { requireAuth } from "../middleware/auth_middleware.js";

export const authRouter = Router();

// ==========================================================
// RATE LIMITING — protege contra fuerza bruta
// 10 intentos por IP+email cada 15 minutos
// ==========================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.body?.email || ""}`,
  message: {
    ok: false,
    codigo: "DEMASIADOS_INTENTOS",
    mensaje: "Demasiados intentos. Intentá nuevamente en 15 minutos.",
  },
});

// ==========================================================
// RUTAS PÚBLICAS
// ==========================================================

authRouter.post("/login",    authLimiter, loginController);
authRouter.post("/register", registerController); // siempre asigna rol USR — no aceptar rol_abreviatura

authRouter.post("/forgot-password",           authLimiter, forgotPasswordController);
authRouter.get( "/verify-reset-token/:token", verificarResetTokenController);
authRouter.post("/reset-password",            resetPasswordController);

// ==========================================================
// RUTAS AUTENTICADAS
// ==========================================================

authRouter.get( "/me",              requireAuth, meController);
authRouter.post("/logout",          requireAuth, logoutController);
authRouter.put( "/cambiar-password",requireAuth, cambiarPasswordController);
