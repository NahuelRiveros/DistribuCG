// `npm run db:seed`: carga los datos base a mano (el servidor también lo hace al arrancar).
import { sequelize } from "../nucleo/db/sequelize.js";
import { sembrarDatosBase } from "./datos_base.js";

try {
  await sembrarDatosBase();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
