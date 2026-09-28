import { sequelize, crearSchemaSiFalta, DB_SCHEMA } from "./sequelize.js";
import { crearMigrador } from "./migrador.js";
import { sembrarDatosBase } from "../../seeds/datos_base.js";

/**
 * Deja la base lista al arrancar el servidor (equivalente al bootstrap de DistribuCG,
 * pero con migraciones versionadas en vez de sync): aplica las migraciones pendientes
 * y carga los datos base. Nunca revierte ni borra nada.
 *
 * Un candado de Postgres por schema evita que dos servidores que arrancan juntos
 * (ej. dos instancias en Render) apliquen la misma migración a la vez.
 */
export async function prepararBase({ log = console.log } = {}) {
  await crearSchemaSiFalta();
  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:clave))", { replacements: { clave: `migraciones:${DB_SCHEMA}` }, transaction });
    const aplicadas = await crearMigrador({ mostrarLog: false }).up();
    if (aplicadas.length > 0) log(`✅ Migraciones aplicadas: ${aplicadas.map((m) => m.name).join(", ")}`);
    await sembrarDatosBase({ log });
    return aplicadas;
  });
}
