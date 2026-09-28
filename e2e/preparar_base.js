import { ADMIN_E2E, ESQUEMA_E2E } from "./config_e2e.js";

// Antes de los E2E: schema limpio, migraciones, roles y un admin de prueba.
export default async function prepararBase() {
  process.env.DB_SCHEMA = ESQUEMA_E2E;
  const { sequelize, DB_SCHEMA } = await import("../servidor/src/nucleo/db/sequelize.js");
  const { crearMigrador } = await import("../servidor/src/nucleo/db/migrador.js");
  const { Rol, ROLES, Usuario } = await import("../servidor/src/modulos/usuarios/modelos.js");
  const { hashearContrasena } = await import("../servidor/src/modulos/usuarios/auth_servicio.js");

  if (!DB_SCHEMA.endsWith("_e2e")) throw new Error(`Schema E2E inválido: ${DB_SCHEMA}`);

  try {
    await sequelize.query(`DROP SCHEMA IF EXISTS ${DB_SCHEMA} CASCADE`);
    await sequelize.query(`CREATE SCHEMA ${DB_SCHEMA}`);
    await crearMigrador({ mostrarLog: false }).up();

    for (const rol of ROLES) await Rol.create(rol);
    const admin = await Usuario.create({
      nombre: ADMIN_E2E.nombre,
      email: ADMIN_E2E.email,
      contrasena: await hashearContrasena(ADMIN_E2E.contrasena),
    });
    await admin.addRoles(await Rol.findAll({ where: { codigo: "admin" } }));
  } finally {
    await sequelize.close();
  }
}
