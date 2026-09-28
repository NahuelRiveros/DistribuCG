// Uso (desde la raíz):
//   npm run db:migrar              → aplica las migraciones pendientes
//   npm run db:migrar:deshacer     → revierte la última
//   npm run db:migracion -- nombre → crea un archivo de migración vacío
import { writeFileSync } from "node:fs";
import path from "node:path";
import { sequelize, crearSchemaSiFalta, DB_SCHEMA } from "./sequelize.js";
import { crearMigrador, CARPETA_MIGRACIONES } from "./migrador.js";

const PLANTILLA = `// Recibe { queryInterface, DataTypes, sequelize, schema }.
// Usar { tableName: "tabla", schema } para que la tabla quede en el schema del proyecto.

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
}

export async function down({ queryInterface, schema }) {
}
`;

function crearArchivo(nombre) {
  if (!/^[a-z][a-z0-9_]*$/.test(nombre ?? "")) {
    throw new Error("Indicá un nombre en snake_case: npm run db:migracion -- crear_producto");
  }
  const d = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  const fecha = `${d.getFullYear()}_${dos(d.getMonth() + 1)}_${dos(d.getDate())}_${dos(d.getHours())}${dos(d.getMinutes())}`;
  const archivo = path.join(CARPETA_MIGRACIONES, `${fecha}_${nombre}.js`);
  writeFileSync(archivo, PLANTILLA, { flag: "wx" });
  console.log(`Migración creada: ${archivo}`);
}

async function main() {
  const [comando, nombre] = process.argv.slice(2);
  if (comando === "crear") return crearArchivo(nombre);

  await sequelize.authenticate();
  await crearSchemaSiFalta();
  const migrador = crearMigrador();
  console.log(`Schema: ${DB_SCHEMA}`);

  if (comando === "arriba") {
    const aplicadas = await migrador.up();
    console.log(aplicadas.length ? `✅ ${aplicadas.length} migración(es) aplicada(s)` : "✅ No había migraciones pendientes");
  } else if (comando === "abajo") {
    const revertidas = await migrador.down();
    console.log(revertidas.length ? `↩️  Revertida: ${revertidas[0].name}` : "No hay migraciones para revertir");
  } else if (comando === "estado") {
    const pendientes = await migrador.pending();
    const ejecutadas = await migrador.executed();
    console.log(`Aplicadas: ${ejecutadas.length} · Pendientes: ${pendientes.map((m) => m.name).join(", ") || "ninguna"}`);
  } else {
    throw new Error(`Comando desconocido: ${comando}. Usar arriba | abajo | estado | crear`);
  }
}

main()
  .catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
