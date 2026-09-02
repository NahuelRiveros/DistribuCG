import { seed_catalogos } from "./seed_catalogos.js";
import { seed_rbac } from "./seed_rbac.js";
import { seed_ejercicios } from "./seed_ejercicios.js";
import { seed_home } from "./seed_home.js";
import { seed_super_admin } from "./seed_super_admin.js";
import { seed_suscripcion } from "./seed_suscripcion.js";

/**
 * Seed de catálogos + usuario super admin — idempotente, seguro de correr
 * en cada arranque del server. No pisa la contraseña de un usuario ya
 * creado (si necesitás resetearla, hacelo desde la app, no acá).
 *
 * El orden importa: seed_ejercicios depende de TipoEjercicio/GrupoMuscular
 * (de seed_catalogos), seed_super_admin depende de que ya exista el rol
 * "admin"/"super_admin" (de seed_rbac). Cada seed_*.js de acá adentro es
 * autocontenido — no se importan entre sí, solo este orquestador los conecta.
 */
export async function seed_database() {
  console.log("🌱 Sembrando datos base...");
  await seed_catalogos();
  await seed_rbac();
  await seed_ejercicios();
  await seed_home();
  await seed_super_admin();
  await seed_suscripcion();
  console.log("✅ Seed finalizado");
}
