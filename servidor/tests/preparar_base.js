// Antes de correr los tests: borra y recrea el schema de test (DB_SCHEMA_TEST)
// y le aplica todas las migraciones. Así cada corrida arranca de una base limpia
// y además se prueba que las migraciones funcionan desde cero.
export default async function prepararBase() {
  process.env.NODE_ENV = "test";
  const { sequelize, DB_SCHEMA } = await import("../src/nucleo/db/sequelize.js");
  const { crearMigrador } = await import("../src/nucleo/db/migrador.js");

  if (!DB_SCHEMA.endsWith("_test")) throw new Error(`Schema de test inválido: ${DB_SCHEMA}`);

  try {
    await sequelize.query(`DROP SCHEMA IF EXISTS ${DB_SCHEMA} CASCADE`);
    await sequelize.query(`CREATE SCHEMA ${DB_SCHEMA}`);
    await crearMigrador({ mostrarLog: false }).up();
  } finally {
    await sequelize.close();
  }
}
