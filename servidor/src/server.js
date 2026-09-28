import { crearApp } from "./app.js";
import { env } from "./nucleo/env.js";
import { sequelize, DB_SCHEMA } from "./nucleo/db/sequelize.js";
import { crearMigrador } from "./nucleo/db/migrador.js";
import { prepararBase } from "./nucleo/db/preparar_base.js";

async function main() {
  await sequelize.authenticate();
  console.log(`✅ Base de datos conectada (schema ${DB_SCHEMA})`);

  if (env.MIGRAR_AL_INICIAR) {
    await prepararBase();
  } else {
    const pendientes = await crearMigrador({ mostrarLog: false }).pending();
    if (pendientes.length > 0) console.warn(`⚠️  Hay ${pendientes.length} migración(es) pendiente(s). Ejecutá: npm run db:migrar`);
  }

  crearApp().listen(env.PORT, () => {
    console.log(`✅ API en http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
  });
}

main().catch((error) => {
  console.error("❌ No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});
