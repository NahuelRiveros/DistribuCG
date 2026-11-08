import { sequelize, DB_SCHEMA } from "../../../database/sequelize.js";
import * as modelos from "../models/index.js";
import { retirarProductos } from "./completar_productos_distribuidora.js";
import { PRODUCTOS_INICIALES } from "./productos_distribuidora/index.js";

// Ejecutar desde la raíz: npm --prefix servidor run catalogo:retirar-demo
// Sin --confirmar solo cuenta. Con --confirmar da de baja (no borra) los artículos del
// catálogo inicial de demostración en la base del .env. Se deshace quitando fecha_baja.
const aplicar = process.argv.includes("--confirmar");
try {
  await sequelize.authenticate();
  const resultado = await sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(741923, 1)", { transaction });
    return retirarProductos(modelos, PRODUCTOS_INICIALES, transaction, { aplicar });
  });
  const conservados = resultado.conservados ? ` Se conservan ${resultado.conservados} que ya tienen código del cliente.` : "";
  if (aplicar) console.log(`✅ Esquema ${DB_SCHEMA}: ${resultado.retirados} artículos de demostración dados de baja.${conservados}`);
  else console.log(`Esquema ${DB_SCHEMA}: se darían de baja ${resultado.retirados} artículos de demostración.${conservados}\nPara hacerlo: npm --prefix servidor run catalogo:retirar-demo -- --confirmar`);
} catch (error) {
  console.error(`❌ No se retiraron los artículos: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
