// Datos que toda instalación necesita. Idempotente: se puede correr en cada arranque.
import { env } from "../nucleo/env.js";
import { Rol, ROLES, Usuario } from "../modulos/usuarios/modelos.js";
import { hashearContrasena } from "../modulos/usuarios/auth_servicio.js";

async function sembrarRoles(log) {
  for (const rol of ROLES) {
    await Rol.findOrCreate({ where: { codigo: rol.codigo }, defaults: rol });
  }
  log(`✅ Roles: ${ROLES.map((r) => r.codigo).join(", ")}`);
}

async function sembrarSuperAdmin(log) {
  const email = env.SUPERADMIN_EMAIL.trim().toLowerCase();
  if (!email || !env.SUPERADMIN_PASSWORD) {
    log("ℹ️  Sin SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD en .env: no se crea el super admin.");
    return;
  }
  // Si ya existe no se toca (tampoco su contraseña): el .env solo sirve para crearlo la primera vez.
  const [usuario, creado] = await Usuario.findOrCreate({
    where: { email, eliminado_en: null },
    defaults: { nombre: env.SUPERADMIN_NOMBRE, email, contrasena: await hashearContrasena(env.SUPERADMIN_PASSWORD) },
  });
  const superAdmin = await Rol.findOne({ where: { codigo: "super_admin" } });
  await usuario.addRoles([superAdmin]);
  log(creado ? `✅ Super admin creado: ${email}` : `ℹ️  Super admin ya existía: ${email}`);
}

export async function sembrarDatosBase({ log = console.log } = {}) {
  await sembrarRoles(log);
  await sembrarSuperAdmin(log);
}
