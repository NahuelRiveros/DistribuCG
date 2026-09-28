import bcrypt from "bcryptjs";
import { sequelize, DB_SCHEMA } from "../src/nucleo/db/sequelize.js";
import { Rol, ROLES, Usuario } from "../src/modulos/usuarios/modelos.js";
import { firmarToken } from "../src/nucleo/auth/tokens.js";

/** Header Authorization listo para supertest: .set(...autorizacion(usuario)) */
export function autorizacion(usuario) {
  return ["Authorization", `Bearer ${firmarToken(usuario)}`];
}

export async function vaciarTablas(...tablas) {
  await sequelize.query(`TRUNCATE ${tablas.map((t) => `${DB_SCHEMA}.${t}`).join(", ")} RESTART IDENTITY CASCADE`);
}

export async function crearRoles() {
  for (const rol of ROLES) await Rol.findOrCreate({ where: { codigo: rol.codigo }, defaults: rol });
}

// Costo 4 en tests para que sean rápidos (en producción se usa 10).
export async function crearUsuario({ email, contrasena = "clave-segura-123", roles = ["cliente"], activo = true }) {
  const usuario = await Usuario.create({ nombre: "Test", email, contrasena: await bcrypt.hash(contrasena, 4), activo });
  await usuario.addRoles(await Rol.findAll({ where: { codigo: roles } }));
  return usuario;
}
