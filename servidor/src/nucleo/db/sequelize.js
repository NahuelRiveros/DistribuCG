import { Sequelize } from "sequelize";
import { env } from "../env.js";

// Traído de DistribuCG (database/sequelize.js): pool y reintentos pensados para Neon,
// que suspende el compute cuando está inactivo.

export const DB_SCHEMA = env.schema;

const baseConfig = {
  dialect: "postgres",
  logging: false,
  dialectOptions: env.DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  // min: 0 para que el pool descarte conexiones ociosas: tras el autosuspend de Neon
  // una conexión vieja queda colgada y el primer request fallaría.
  pool: { max: 5, min: 0, acquire: 30_000, idle: 10_000 },
  retry: {
    max: 3,
    match: [
      /ConnectionError/,
      /ConnectionRefusedError/,
      /ConnectionTimedOutError/,
      /TimeoutError/,
      /Connection terminated unexpectedly/i,
      /terminating connection/i,
      /ECONNRESET/,
      /ETIMEDOUT/,
    ],
  },
};

export const sequelize = env.NEON_DATABASE_URL
  ? new Sequelize(env.NEON_DATABASE_URL, baseConfig)
  : new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, { ...baseConfig, host: env.DB_HOST, port: env.DB_PORT });

// El pooler de Neon no acepta search_path al conectar: se fija después de cada conexión.
sequelize.afterConnect(async (conexion) => {
  await conexion.query(`SET search_path TO ${DB_SCHEMA}, public`);
  await conexion.query("SET TIME ZONE 'America/Argentina/Cordoba'");
});

export async function crearSchemaSiFalta() {
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA}`);
}
