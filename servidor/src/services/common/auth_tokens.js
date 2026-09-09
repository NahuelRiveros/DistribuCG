import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
export const passwordVersion = (hash) => createHash("sha256").update(hash).digest("hex");
export function createResetToken(user, secret, minutes) {
  return jwt.sign({ purpose: "password-reset" }, secret + user.contrasena, { algorithm: "HS256", subject: String(user.id), audience: "password-reset", expiresIn: minutes * 60 });
}
export function verifyResetToken(token, user, secret) {
  const result = jwt.verify(token, secret + user.contrasena, { algorithms: ["HS256"], audience: "password-reset", subject: String(user.id) });
  if (result.purpose !== "password-reset") throw new Error("Invalid purpose");
  return result;
}
