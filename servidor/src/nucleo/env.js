import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// servidor/.env, sin importar desde qué carpeta se arranque (npm, tests, Playwright).
// Las variables ya definidas en el entorno tienen prioridad sobre el archivo.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

// Único lugar donde se lee process.env. Si falta algo obligatorio, el servidor no arranca.

const nombreSchema = z.string().regex(/^[a-z][a-z0-9_]*$/, "solo minúsculas, números y _");

const esquema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  NEON_DATABASE_URL: z.string().default(""),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().default("postgres"),
  DB_PASS: z.string().default(""),
  DB_SSL: z.string().default("false").transform((v) => v.toLowerCase() === "true"),
  DB_SCHEMA: nombreSchema.default("mi_eccomerce"),
  // Los tests borran este schema entero: se exige el sufijo para no borrar datos reales por error.
  DB_SCHEMA_TEST: nombreSchema.endsWith("_test", "tiene que terminar en _test").default("mi_eccomerce_test"),

  // true: al arrancar aplica migraciones pendientes y datos base (como el bootstrap de DistribuCG).
  MIGRAR_AL_INICIAR: z.string().default("true").transform((v) => v.toLowerCase() === "true"),

  JWT_SECRET: z.string().min(32, "tiene que tener al menos 32 caracteres"),
  JWT_EXPIRA: z.string().default("7d"),
  // Intentos de login por IP + email cada 15 minutos (protección contra fuerza bruta).
  LIMITE_LOGIN: z.coerce.number().int().positive().default(10),
  CORS_ORIGIN: z.string().default(""),

  // Imágenes (Cloudinary). Opcionales: sin ellas se pueden cargar imágenes por URL.
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  CLOUDINARY_CARPETA: z.string().default("mi_eccomerce"),

  SUPERADMIN_NOMBRE: z.string().default("Admin"),
  SUPERADMIN_EMAIL: z.string().default(""),
  SUPERADMIN_PASSWORD: z.string().default(""),
});

const valores = { ...process.env };
if (valores.NODE_ENV === "test" && !valores.JWT_SECRET) {
  valores.JWT_SECRET = "secreto_de_test_solo_para_vitest_0123456789";
}

const resultado = esquema.safeParse(valores);
if (!resultado.success) {
  const lineas = resultado.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Variables de entorno inválidas en servidor/.env:\n${lineas}`);
}

const datos = resultado.data;

export const env = {
  ...datos,
  esProduccion: datos.NODE_ENV === "production",
  esTest: datos.NODE_ENV === "test",
  imagenesConfiguradas: Boolean(datos.CLOUDINARY_CLOUD_NAME && datos.CLOUDINARY_API_KEY && datos.CLOUDINARY_API_SECRET),
  // Schema efectivo: en tests se usa uno aparte que se recrea en cada corrida.
  schema: datos.NODE_ENV === "test" ? datos.DB_SCHEMA_TEST : datos.DB_SCHEMA,
};
