import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../configuracion_servidor/env.js";
import { Persona, Usuario } from "../models/index.js";

function safeStr(v) {
  return String(v ?? "").trim();
}

function crearToken({ usuario_id, persona_id, roles }) {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en .env");

  return jwt.sign({ sub: usuario_id, persona_id, roles }, secret, {
    expiresIn: env.JWT_EXPIRES_IN ?? "24h",
  });
}

export async function login({ email, password }) {
  const emailNorm = safeStr(email).toLowerCase();
  const pass = safeStr(password);

  const persona = await Persona.findOne({ where: { email: emailNorm } });
  if (!persona) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  const usuario = await Usuario.findOne({ where: { persona_id: persona.id } });
  if (!usuario) {
    return { ok: false, codigo: "SIN_USUARIO", mensaje: "La persona no tiene usuario habilitado" };
  }

  if (usuario.eliminado_en) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  if (usuario.activo === false) {
    return { ok: false, codigo: "USUARIO_INACTIVO", mensaje: "Usuario inactivo" };
  }

  const valido = await bcrypt.compare(pass, usuario.contrasena ?? "");
  if (!valido) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  const rolesRows = await usuario.getRoles({
    attributes: ["codigo"],
    joinTableAttributes: [],
  });

  const roles = rolesRows.map((r) => r.codigo);

  const token = crearToken({ usuario_id: usuario.id, persona_id: persona.id, roles });

  await usuario.update({ ultimo_login: new Date() });

  return {
    ok: true,
    codigo: "LOGIN_OK",
    mensaje: "Login correcto",
    token,
    usuario: {
      usuario_id: usuario.id,
      persona_id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      email: persona.email,
      roles,
    },
  };
}

export async function obtenerPerfil(persona_id) {
  const persona = await Persona.findByPk(persona_id, {
    attributes: ["nombre", "apellido", "email"],
  });

  return {
    ok: true,
    persona: {
      nombre:   persona?.nombre   ?? null,
      apellido: persona?.apellido ?? null,
      email:    persona?.email    ?? null,
    },
  };
}

export async function resetearPassword({ email, newPassword }) {
  const persona = await Persona.findOne({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (!persona) {
    return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "Email no encontrado" };
  }

  const usuario = await Usuario.findOne({ where: { persona_id: persona.id } });
  if (!usuario) {
    return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "Usuario no encontrado" };
  }

  const hash = await bcrypt.hash(String(newPassword).trim(), 10);
  await usuario.update({ contrasena: hash });

  return { ok: true, codigo: "PASSWORD_ACTUALIZADA", mensaje: "Contraseña actualizada correctamente" };
}
