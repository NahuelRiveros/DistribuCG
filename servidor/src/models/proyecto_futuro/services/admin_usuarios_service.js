import bcrypt from "bcryptjs";
import { sequelize } from "../database/sequelize.js";
import { Auth01Rol, Auth02Usuario } from "../models/index.js";

// ==========================================================
// FORZAR RESET DE CONTRASEÑA
// Para admins que necesitan resetear la clave sin pasar por email.
// ==========================================================

export async function forzarResetPassword(usuarioId, nuevaPassword) {
  if (!nuevaPassword || String(nuevaPassword).length < 6) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
  }

  const usuario = await Auth02Usuario.findByPk(usuarioId);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };

  const hash = await bcrypt.hash(String(nuevaPassword), 10);
  await usuario.update({ AUTH02_CONTRASENA: hash });

  return { ok: true, mensaje: "Contraseña actualizada por administrador" };
}

// ==========================================================
// CREAR USUARIO CON TRANSACCIÓN
// Si algo falla revierte todo el registro.
// ==========================================================

export async function crearUsuarioTransaccional(data) {
  return await sequelize.transaction(async (t) => {
    const nombre   = String(data?.nombre   || "").trim();
    const apellido = String(data?.apellido || "").trim();
    const email    = String(data?.email    || "").trim().toLowerCase();
    const password = String(data?.password || "");
    const username = String(data?.username || email.split("@")[0]).trim();
    const rolId    = data?.rol_id ? Number(data.rol_id) : null;

    if (!nombre || !apellido || !email || !password) {
      return { ok: false, mensaje: "Faltan datos obligatorios: nombre, apellido, email, password" };
    }

    if (password.length < 6) {
      return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
    }

    const emailOcupado = await Auth02Usuario.findOne({ where: { AUTH02_EMAIL: email }, transaction: t });
    if (emailOcupado) return { ok: false, mensaje: "Ya existe un usuario con ese correo" };

    let rol;
    if (rolId) {
      rol = await Auth01Rol.findByPk(rolId, { transaction: t });
      if (!rol || rol.AUTH01_FECHABAJA) return { ok: false, mensaje: "El rol indicado no existe o está inactivo" };
    } else {
      rol = await Auth01Rol.findOne({ where: { AUTH01_ABREVIATURA: "USR" }, transaction: t });
      if (!rol) return { ok: false, mensaje: "No existe el rol USR" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await Auth02Usuario.create(
      {
        RELA_AUTH01:      rol.ID_AUTH01,
        AUTH02_NOMBRE:    nombre,
        AUTH02_APELLIDO:  apellido,
        AUTH02_EMAIL:     email,
        AUTH02_CONTRASENA: passwordHash,
        AUTH02_USERNAME:  username,
        AUTH02_AVATAR:    null,
        AUTH02_FECHAALTA: new Date(),
        AUTH02_FECHABAJA: null,
      },
      { transaction: t }
    );

    return {
      ok: true,
      mensaje: "Usuario creado correctamente",
      data: {
        usuario_id: usuario.ID_AUTH02,
        email:      usuario.AUTH02_EMAIL,
        username:   usuario.AUTH02_USERNAME,
        rol:        rol.AUTH01_NOMBRE,
      },
    };
  });
}
