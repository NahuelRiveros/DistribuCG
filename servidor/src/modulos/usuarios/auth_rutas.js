import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { loginSchema, registroSchema } from "compartido/schemas/auth.js";
import { env } from "../../nucleo/env.js";
import { validar } from "../../nucleo/validar.js";
import { requerirAuth } from "../../nucleo/auth/middlewares.js";
import { login, registro, yo } from "./auth_controlador.js";

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.INTENTOS_LOGIN,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.esTest,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? "").toLowerCase()}`,
  message: { ok: false, codigo: "DEMASIADOS_INTENTOS", mensaje: "Demasiados intentos. Probá de nuevo en 15 minutos.", detalles: [] },
});

const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.esTest,
  message: { ok: false, codigo: "DEMASIADOS_INTENTOS", mensaje: "Demasiados registros desde esta conexión. Probá de nuevo en una hora.", detalles: [] },
});

export const authRutas = Router();

authRutas.post("/login", limiteLogin, validar({ body: loginSchema }), login);
authRutas.post("/registro", limiteRegistro, validar({ body: registroSchema }), registro);
authRutas.get("/yo", requerirAuth, yo);
