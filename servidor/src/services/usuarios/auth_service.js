import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../configuracion_servidor/env.js";
import { sequelize } from "../../database/sequelize.js";
import { Persona, Usuario, UsuarioRol, Rol, TipoDocumento } from "../../models/index.js";

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

/**
 * Auto-registro público (POST /auth/register) — siempre asigna el rol fijo
 * "cliente" (ver seed_rbac.js). Distinto de crearStaff (admin_staff_service.js),
 * que es para personal interno cargado por un admin.
 *
 * `documento` de Persona es NOT NULL + unique y el formulario de registro no
 * lo pide (no tiene sentido pedir DNI para un cliente mayorista) — se genera
 * un valor sintético único, no es un documento real.
 */
export async function registrarCliente({ nombre, apellido, email, password }) {
  const nombreN   = safeStr(nombre);
  const apellidoN = safeStr(apellido);
  const emailN    = safeStr(email).toLowerCase();
  const pass      = safeStr(password);

  if (!nombreN || !apellidoN || !emailN || !pass) {
    return { ok: false, codigo: "FALTAN_DATOS", mensaje: "Requiere: nombre, apellido, email y password" };
  }
  if (pass.length < 6) {
    return { ok: false, codigo: "PASSWORD_INVALIDA", mensaje: "La contraseña debe tener al menos 6 caracteres" };
  }

  const yaExiste = await Persona.findOne({ where: { email: emailN } });
  if (yaExiste) {
    return { ok: false, codigo: "EMAIL_DUPLICADO", mensaje: "Ya existe una cuenta con ese email" };
  }

  return await sequelize.transaction(async (t) => {
    const tipoDocumentoDni = await TipoDocumento.findOne({ where: { descripcion: "DNI" }, transaction: t });
    const documentoSintetico = `REG${Date.now()}`;

    const persona = await Persona.create({
      nombre: nombreN, apellido: apellidoN, email: emailN,
      documento: documentoSintetico,
      tipo_documento_id: tipoDocumentoDni?.id ?? null,
    }, { transaction: t });

    const hash = await bcrypt.hash(pass, 10);
    const usuario = await Usuario.create(
      { persona_id: persona.id, contrasena: hash, activo: true },
      { transaction: t }
    );

    const rolCliente = await Rol.findOne({ where: { codigo: "cliente" }, transaction: t });
    if (rolCliente) {
      await UsuarioRol.create({ usuario_id: usuario.id, rol_id: rolCliente.id }, { transaction: t });
    }

    return { ok: true, codigo: "REGISTRO_OK", mensaje: "Cuenta creada correctamente", usuario_id: usuario.id };
  });
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
