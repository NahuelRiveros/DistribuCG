import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { Auth01Rol, Auth02Usuario, Auth05UsuarioRol } from "../models/index.js";
import { sequelize } from "../database/sequelize.js";
import { env } from "../configuracion_servidor/env.js";

// Rol exclusivo del sistema — nadie puede asignarlo vía API
const ROL_SISTEMA_EXCLUSIVO = "SADM";

// ==========================================================
// HELPERS
// ==========================================================

function normalizarTexto(t) { return String(t || "").trim(); }
function normalizarEmail(e) { return String(e || "").trim().toLowerCase(); }
function derivarUsername(email) { return email.split("@")[0].replace(/[^a-z0-9._-]/gi, ""); }

// Include estándar para cargar roles activos N:N
const INCLUDE_ROLES = [{
  model: Auth01Rol,
  as:    "roles",
  through: { attributes: [], where: { AUTH05_FECHABAJA: null } },
  attributes: ["ID_AUTH01", "AUTH01_NOMBRE", "AUTH01_ABREVIATURA", "AUTH01_NIVEL"],
}];

// Formatea un usuario para la respuesta (sin contraseña)
function _formatear(usuario) {
  const u = usuario.toJSON ? usuario.toJSON() : usuario;
  delete u.AUTH02_CONTRASENA;
  delete u.RELA_AUTH01; // columna deprecated
  return u;
}

// ==========================================================
// CREAR USUARIO
// ==========================================================

// forzarRol: cuando viene de registro público siempre asigna USR.
// Cuando viene del panel admin (crearUsuario) respeta rol_abreviatura del body.
export async function crearUsuario(data, { forzarRol } = {}) {
  const nombre    = normalizarTexto(data?.nombre);
  const apellido  = normalizarTexto(data?.apellido);
  const documento = normalizarTexto(data?.documento) || null;
  const email     = normalizarEmail(data?.email);
  const password  = String(data?.password || "");
  const username  = normalizarTexto(data?.username) || derivarUsername(email);
  const rolAbr    = forzarRol
    ? String(forzarRol).toUpperCase()
    : (normalizarTexto(data?.rol_abreviatura).toUpperCase() || "USR");

  if (rolAbr === ROL_SISTEMA_EXCLUSIVO) {
    return { ok: false, mensaje: `El rol "${ROL_SISTEMA_EXCLUSIVO}" es exclusivo del sistema y no puede asignarse manualmente` };
  }

  if (!nombre || !apellido || !email || !password) {
    return { ok: false, mensaje: "Faltan datos obligatorios: nombre, apellido, email, password" };
  }

  if (password.length < 6) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
  }

  const emailOcupado = await Auth02Usuario.findOne({ where: { AUTH02_EMAIL: email } });
  if (emailOcupado) return { ok: false, mensaje: "Ya existe un usuario con ese correo" };

  const usernameOcupado = await Auth02Usuario.findOne({ where: { AUTH02_USERNAME: username } });
  if (usernameOcupado) return { ok: false, mensaje: "El nombre de usuario ya está en uso" };

  const rol = await Auth01Rol.findOne({
    where: { AUTH01_ABREVIATURA: rolAbr, AUTH01_FECHABAJA: null },
  });
  if (!rol) return { ok: false, mensaje: `El rol "${rolAbr}" no existe o está inactivo` };

  const passwordHash = await bcrypt.hash(password, 10);

  // Transacción: si falla el insert de la junction, el usuario no queda sin roles
  return await sequelize.transaction(async (t) => {
    const usuario = await Auth02Usuario.create({
      AUTH02_NOMBRE:     nombre,
      AUTH02_APELLIDO:   apellido,
      AUTH02_DOCUMENTO:  documento,
      AUTH02_EMAIL:      email,
      AUTH02_CONTRASENA: passwordHash,
      AUTH02_USERNAME:   username,
      AUTH02_AVATAR:     null,
      AUTH02_FECHAALTA:  new Date(),
      AUTH02_FECHABAJA:  null,
    }, { transaction: t });

    await Auth05UsuarioRol.create({
      RELA_AUTH02:      usuario.ID_AUTH02,
      RELA_AUTH01:      rol.ID_AUTH01,
      AUTH05_FECHAALTA: new Date(),
      AUTH05_FECHABAJA: null,
    }, { transaction: t });

    return {
      ok: true,
      mensaje: "Usuario creado correctamente",
      data: {
        usuario_id: usuario.ID_AUTH02,
        email:      usuario.AUTH02_EMAIL,
        username:   usuario.AUTH02_USERNAME,
        roles:      [{ nombre: rol.AUTH01_NOMBRE, abreviatura: rol.AUTH01_ABREVIATURA }],
      },
    };
  });
}

// ==========================================================
// LISTAR USUARIOS
// ==========================================================

// callerEmail: email del usuario que hace el request.
// Si es el super admin, ve a todos. Si es ADM normal, el super admin queda oculto.
export async function listarUsuarios(callerEmail) {
  const esSuperAdmin = callerEmail === env.SUPER_ADMIN_EMAIL;

  const where = esSuperAdmin
    ? {}
    : { AUTH02_EMAIL: { [Op.ne]: env.SUPER_ADMIN_EMAIL } };

  const usuarios = await Auth02Usuario.findAll({
    where,
    include: INCLUDE_ROLES,
    order: [["ID_AUTH02", "DESC"]],
  });
  return usuarios.map(_formatear);
}

// ==========================================================
// OBTENER USUARIO
// ==========================================================

export async function obtenerUsuario(id) {
  const usuario = await Auth02Usuario.findByPk(id, { include: INCLUDE_ROLES });
  if (!usuario) return null;
  return _formatear(usuario);
}

// ==========================================================
// ACTUALIZAR DATOS PERSONALES
// ==========================================================

export async function actualizarUsuario(id, data) {
  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  const campos = {};

  if (data?.nombre)   campos.AUTH02_NOMBRE   = normalizarTexto(data.nombre);
  if (data?.apellido) campos.AUTH02_APELLIDO  = normalizarTexto(data.apellido);
  if (data?.avatar)   campos.AUTH02_AVATAR    = normalizarTexto(data.avatar);

  if (data?.email) {
    const emailNvo = normalizarEmail(data.email);
    const ocupado  = await Auth02Usuario.findOne({ where: { AUTH02_EMAIL: emailNvo } });
    if (ocupado && ocupado.ID_AUTH02 !== Number(id)) {
      return { ok: false, mensaje: "Ya existe un usuario con ese correo" };
    }
    campos.AUTH02_EMAIL = emailNvo;
  }

  if (data?.username) {
    const usernameNvo = normalizarTexto(data.username);
    const ocupado     = await Auth02Usuario.findOne({ where: { AUTH02_USERNAME: usernameNvo } });
    if (ocupado && ocupado.ID_AUTH02 !== Number(id)) {
      return { ok: false, mensaje: "El nombre de usuario ya está en uso" };
    }
    campos.AUTH02_USERNAME = usernameNvo;
  }

  if (data?.password) {
    if (String(data.password).length < 6) {
      return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
    }
    campos.AUTH02_CONTRASENA = await bcrypt.hash(String(data.password), 10);
  }

  if (!Object.keys(campos).length) {
    return { ok: false, mensaje: "No se enviaron campos para actualizar" };
  }

  await usuario.update(campos);

  return { ok: true, mensaje: "Usuario actualizado correctamente" };
}

// ==========================================================
// BAJA LÓGICA
// ==========================================================

export async function eliminarUsuario(id) {
  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  await usuario.update({ AUTH02_FECHABAJA: new Date() });

  return { ok: true, mensaje: "Usuario desactivado correctamente" };
}

// ==========================================================
// REACTIVAR
// ==========================================================

export async function reactivarUsuario(id) {
  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  await usuario.update({ AUTH02_FECHABAJA: null });

  return { ok: true, mensaje: "Usuario reactivado correctamente" };
}

// ==========================================================
// ASIGNAR ROLES (reemplaza todos los roles activos)
// Recibe: abreviaturas: string[]  — ej: ["ADM", "STF"]
// Revoca todos los roles actuales y asigna los nuevos.
// ==========================================================

export async function asignarRolesUsuario(id, abreviaturas) {
  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  if (!Array.isArray(abreviaturas) || abreviaturas.length === 0) {
    return { ok: false, mensaje: "Enviá al menos un rol (campo roles: string[])" };
  }

  const abrs = [...new Set(abreviaturas.map((a) => String(a).trim().toUpperCase()))];

  if (abrs.includes(ROL_SISTEMA_EXCLUSIVO)) {
    return { ok: false, mensaje: `El rol "${ROL_SISTEMA_EXCLUSIVO}" es exclusivo del sistema y no puede asignarse manualmente` };
  }

  const roles = await Auth01Rol.findAll({
    where: { AUTH01_ABREVIATURA: abrs, AUTH01_FECHABAJA: { [Op.is]: null } },
  });

  const encontrados = roles.map((r) => r.AUTH01_ABREVIATURA);
  const noEncontrados = abrs.filter((a) => !encontrados.includes(a));
  if (noEncontrados.length) {
    return { ok: false, mensaje: `Roles no encontrados o inactivos: ${noEncontrados.join(", ")}` };
  }

  // Revocar roles activos actuales
  await Auth05UsuarioRol.update(
    { AUTH05_FECHABAJA: new Date() },
    { where: { RELA_AUTH02: Number(id), AUTH05_FECHABAJA: { [Op.is]: null } } }
  );

  // Asignar nuevos roles — usar findOne+update para respetar el unique (RELA_AUTH02, RELA_AUTH01)
  for (const rol of roles) {
    const existente = await Auth05UsuarioRol.findOne({
      where: { RELA_AUTH02: Number(id), RELA_AUTH01: rol.ID_AUTH01 },
    });
    if (existente) {
      await existente.update({ AUTH05_FECHAALTA: new Date(), AUTH05_FECHABAJA: null });
    } else {
      await Auth05UsuarioRol.create({
        RELA_AUTH02:      Number(id),
        RELA_AUTH01:      rol.ID_AUTH01,
        AUTH05_FECHAALTA: new Date(),
        AUTH05_FECHABAJA: null,
      });
    }
  }

  return {
    ok: true,
    mensaje: "Roles actualizados correctamente",
    data: { usuario_id: Number(id), roles: roles.map((r) => r.AUTH01_NOMBRE) },
  };
}

// ==========================================================
// AGREGAR UN ROL (sin quitar los existentes)
// ==========================================================

export async function agregarRolUsuario(id, abreviatura) {
  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  const abr = String(abreviatura || "").trim().toUpperCase();

  if (abr === ROL_SISTEMA_EXCLUSIVO) {
    return { ok: false, mensaje: `El rol "${ROL_SISTEMA_EXCLUSIVO}" es exclusivo del sistema y no puede asignarse manualmente` };
  }

  const rol  = await Auth01Rol.findOne({ where: { AUTH01_ABREVIATURA: abr, AUTH01_FECHABAJA: null } });
  if (!rol) return { ok: false, mensaje: `El rol "${abr}" no existe o está inactivo` };

  const yaAsignado = await Auth05UsuarioRol.findOne({
    where: { RELA_AUTH02: id, RELA_AUTH01: rol.ID_AUTH01, AUTH05_FECHABAJA: null },
  });
  if (yaAsignado) return { ok: false, mensaje: `El usuario ya tiene el rol "${rol.AUTH01_NOMBRE}"` };

  await Auth05UsuarioRol.create({
    RELA_AUTH02:      Number(id),
    RELA_AUTH01:      rol.ID_AUTH01,
    AUTH05_FECHAALTA: new Date(),
    AUTH05_FECHABAJA: null,
  });

  return {
    ok: true,
    mensaje: `Rol "${rol.AUTH01_NOMBRE}" asignado correctamente`,
  };
}

// ==========================================================
// QUITAR UN ROL (soft delete en la junction)
// ==========================================================

export async function quitarRolUsuario(id, abreviatura) {
  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  const abr = String(abreviatura || "").trim().toUpperCase();
  const rol  = await Auth01Rol.findOne({ where: { AUTH01_ABREVIATURA: abr } });
  if (!rol) return { ok: false, mensaje: `El rol "${abr}" no existe` };

  const asignacion = await Auth05UsuarioRol.findOne({
    where: { RELA_AUTH02: id, RELA_AUTH01: rol.ID_AUTH01, AUTH05_FECHABAJA: null },
  });
  if (!asignacion) return { ok: false, mensaje: `El usuario no tiene el rol "${rol.AUTH01_NOMBRE}"` };

  // Prevenir que el usuario quede sin ningún rol
  const activos = await Auth05UsuarioRol.count({
    where: { RELA_AUTH02: id, AUTH05_FECHABAJA: null },
  });
  if (activos <= 1) {
    return { ok: false, mensaje: "El usuario debe tener al menos un rol asignado" };
  }

  await asignacion.update({ AUTH05_FECHABAJA: new Date() });

  return {
    ok: true,
    mensaje: `Rol "${rol.AUTH01_NOMBRE}" removido correctamente`,
  };
}

// ==========================================================
// RESETEAR PASSWORD (admin — sin necesitar la contraseña actual)
// ==========================================================

export async function resetearPasswordUsuario(id, nuevaPassword) {
  if (!nuevaPassword || String(nuevaPassword).length < 6) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
  }

  const usuario = await Auth02Usuario.findByPk(id);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  const hash = await bcrypt.hash(String(nuevaPassword), 10);
  await usuario.update({ AUTH02_CONTRASENA: hash });

  return { ok: true, mensaje: "Contraseña actualizada por administrador" };
}

// ==========================================================
// PERFIL PROPIO (usuario autenticado ve su propio registro en DB)
// Más actualizado que /auth/me que devuelve datos del JWT.
// ==========================================================

export async function obtenerPerfil(usuario_id) {
  const usuario = await Auth02Usuario.findByPk(usuario_id, { include: INCLUDE_ROLES });
  if (!usuario) return null;
  return _formatear(usuario);
}
