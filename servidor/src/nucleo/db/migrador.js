import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DataTypes } from "sequelize";
import { Umzug, SequelizeStorage } from "umzug";
import { sequelize, DB_SCHEMA } from "./sequelize.js";

export const CARPETA_MIGRACIONES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migraciones");

// Cada migración exporta up() y down() y recibe este contexto:
//   export async function up({ queryInterface, DataTypes, sequelize, schema }) { ... }
// Las aplicadas se registran en la tabla <schema>.migraciones.
export function crearMigrador({ mostrarLog = true } = {}) {
  const contexto = { queryInterface: sequelize.getQueryInterface(), DataTypes, sequelize, schema: DB_SCHEMA };

  return new Umzug({
    migrations: {
      glob: ["*.js", { cwd: CARPETA_MIGRACIONES }],
      resolve: ({ name, path: archivo }) => {
        const cargar = () => import(pathToFileURL(archivo).href);
        return {
          name,
          up: async () => (await cargar()).up(contexto),
          down: async () => (await cargar()).down(contexto),
        };
      },
    },
    storage: new SequelizeStorage({ sequelize, schema: DB_SCHEMA, tableName: "migraciones" }),
    logger: mostrarLog ? console : undefined,
  });
}
