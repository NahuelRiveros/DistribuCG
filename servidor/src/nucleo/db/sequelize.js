import { Sequelize } from "sequelize";
import { env } from "../env.js";

// Traído de DistribuCG (database/sequelize.js): pool y reintentos pensados para Neon,
// que suspende el compute cuando está inactivo.

export const DB_SCHEMA = env.schema;

const baseConfig = {
  dialect: "postgres",
  logging: false,
  dialectOptions: env.BD_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
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

// En Render: la dirección de Neon. En tu PC: el Postgres local.
export const sequelize = env.BD_URL_NEON
  ? new Sequelize(env.BD_URL_NEON, baseConfig)
  : new Sequelize(env.BD_NOMBRE, env.BD_USUARIO, env.BD_CONTRASENA, { ...baseConfig, host: env.BD_HOST, port: env.BD_PUERTO });

// El pooler de Neon no acepta search_path al conectar: se fija después de cada conexión.
sequelize.afterConnect(async (conexion) => {
  await conexion.query(`SET search_path TO ${DB_SCHEMA}, public`);
  await conexion.query("SET TIME ZONE 'America/Argentina/Cordoba'");
});

export async function crearSchemaSiFalta() {
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA}`);
}
