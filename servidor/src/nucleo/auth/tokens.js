import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

// Traído de DistribuCG (services/common/auth_tokens.js): el token lleva una "versión"
// derivada del hash de la contraseña. Si la contraseña cambia, los tokens viejos dejan de valer.
export const versionContrasena = (hash) => createHash("sha256").update(hash).digest("hex").slice(0, 16);

export function firmarToken(usuario) {
  return jwt.sign({ pv: versionContrasena(usuario.contrasena) }, env.CLAVE_SESIONES, {
    algorithm: "HS256",
    subject: String(usuario.id),
    expiresIn: env.DURACION_SESION,
  });
}

export function verificarToken(token) {
  return jwt.verify(token, env.CLAVE_SESIONES, { algorithms: ["HS256"] });
}
