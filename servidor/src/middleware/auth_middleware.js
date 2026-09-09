import jwt from "jsonwebtoken";
import { env } from "../configuracion_servidor/env.js";
import { Usuario } from "../models/index.js";
import { passwordVersion } from "../services/common/auth_tokens.js";
async function authenticate(req) {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const payload = jwt.verify(auth.slice(7), env.JWT_SECRET, { algorithms: ["HS256"] });
  const user = await Usuario.findByPk(payload.sub);
  if (!user || !user.activo || user.eliminado_en || payload.pv !== passwordVersion(user.contrasena)) return null;
  const roles = await user.getRoles({ attributes: ["codigo"], joinTableAttributes: [] });
  return { usuario_id: user.id, persona_id: user.persona_id, roles: roles.map((r) => r.codigo) };
}
export async function requireAuth(req, res, next) {
  try {
    req.user = await authenticate(req);
    if (!req.user) return res.status(401).json({ ok: false, codigo: "NO_AUTH", mensaje: "Ingresá para continuar." });
    return next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError" || e.name === "NotBeforeError")
      return res.status(401).json({ ok: false, codigo: "TOKEN_INVALIDO", mensaje: "Tu sesión venció. Ingresá nuevamente." });
    return next(e);
  }
}
export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return requireAuth(req, res, next);
}
export function requireRole(...roles) {
  return (req, res, next) => (req.user?.roles ?? []).some((r) => roles.includes(r)) ? next()
    : res.status(403).json({ ok: false, codigo: "SIN_PERMISO", mensaje: "No tenés permisos" });
}
