import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// servidor/.env, sin importar desde qué carpeta se arranque (npm, tests, Playwright).
// Las variables ya definidas en el entorno (ej. las de Render) tienen prioridad sobre el archivo.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

// Único lugar donde se lee process.env. Si falta algo obligatorio, el servidor no arranca.
// Los nombres dicen qué va y de dónde sale (ver servidor/.env.example).

// Nombres anteriores: se siguen aceptando (con aviso) para no romper un .env viejo.
const NOMBRES_ANTERIORES = {
  BD_URL_NEON: "NEON_DATABASE_URL",
  BD_HOST: "DB_HOST",
  BD_PUERTO: "DB_PORT",
  BD_NOMBRE: "DB_NAME",
  BD_USUARIO: "DB_USER",
  BD_CONTRASENA: "DB_PASS",
  BD_SSL: "DB_SSL",
  BD_ESQUEMA: "DB_SCHEMA",
  BD_ESQUEMA_TEST: "DB_SCHEMA_TEST",
  CLAVE_SESIONES: "JWT_SECRET",
  DURACION_SESION: "JWT_EXPIRA",
  INTENTOS_LOGIN: "LIMITE_LOGIN",
  URL_FRONTEND_VERCEL: "CORS_ORIGIN",
  CLOUDINARY_NOMBRE_NUBE: "CLOUDINARY_CLOUD_NAME",
  CLOUDINARY_CLAVE_API: "CLOUDINARY_API_KEY",
  CLOUDINARY_SECRETO_API: "CLOUDINARY_API_SECRET",
  SUPERADMIN_CONTRASENA: "SUPERADMIN_PASSWORD",
};

const nombreSchema = z.string().regex(/^[a-z][a-z0-9_]*$/, "solo minúsculas, números y _");
const siNo = (porDefecto) => z.string().default(porDefecto).transform((v) => v.toLowerCase() === "true");

const esquema = z
  .object({
    // Estándar de Node (lo leen librerías): development | test | production. En Render: production.
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Render lo define solo; en tu PC, 3001.
    PORT: z.coerce.number().int().positive().default(3001),

    // ── Base de datos ──
    // En Render: la dirección de conexión que da Neon (postgresql://…). Si está, se ignoran las BD_ de abajo.
    BD_URL_NEON: z.string().default(""),
    // En tu PC (Postgres local), si no usás BD_URL_NEON:
    BD_HOST: z.string().default("localhost"),
    BD_PUERTO: z.coerce.number().int().positive().default(5432),
    BD_NOMBRE: z.string().default(""),
    BD_USUARIO: z.string().default("postgres"),
    BD_CONTRASENA: z.string().default(""),
    // Conexión cifrada: con Neon siempre (se activa sola si hay BD_URL_NEON).
    BD_SSL: z.string().default(""),
    // Esquema (carpeta de tablas) de este cliente dentro de la base.
    BD_ESQUEMA: nombreSchema.default("mi_eccomerce"),
    // Los tests borran este esquema entero: se exige el sufijo para no borrar datos reales por error.
    BD_ESQUEMA_TEST: nombreSchema.endsWith("_test", "tiene que terminar en _test").default("mi_eccomerce_test"),
    // true: al arrancar aplica migraciones pendientes y datos base.
    MIGRAR_AL_INICIAR: siNo("true"),

    // ── Sesiones y seguridad ──
    // Texto largo al azar que firma los inicios de sesión. Uno distinto por cliente; si se cambia, todos vuelven a ingresar.
    CLAVE_SESIONES: z.string().min(32, "tiene que tener al menos 32 caracteres"),
    DURACION_SESION: z.string().default("7d"),
    // Intentos de login por IP + email cada 15 minutos (protección contra fuerza bruta).
    INTENTOS_LOGIN: z.coerce.number().int().positive().default(10),
    // Dirección de la tienda (Vercel): solo desde ahí se puede usar la API. Varias, separadas por coma.
    URL_FRONTEND_VERCEL: z.string().default(""),

    // ── Imágenes (Cloudinary). Opcionales: sin ellas se pueden cargar imágenes por URL ──
    CLOUDINARY_NOMBRE_NUBE: z.string().default(""),
    CLOUDINARY_CLAVE_API: z.string().default(""),
    CLOUDINARY_SECRETO_API: z.string().default(""),
    CLOUDINARY_CARPETA: z.string().default("mi_eccomerce"),

    // ── Primer usuario (super admin): se crea al arrancar si no existe ──
    SUPERADMIN_NOMBRE: z.string().default("Admin"),
    SUPERADMIN_EMAIL: z.string().default(""),
    SUPERADMIN_CONTRASENA: z.string().default(""),
  })
  .superRefine((v, ctx) => {
    if (!v.BD_URL_NEON && !v.BD_NOMBRE) {
      ctx.addIssue({ code: "custom", path: ["BD_URL_NEON"], message: "falta la base de datos: BD_URL_NEON (Neon) o BD_NOMBRE (Postgres local)" });
    }
    if (v.NODE_ENV === "production" && !v.URL_FRONTEND_VERCEL) {
      ctx.addIssue({ code: "custom", path: ["URL_FRONTEND_VERCEL"], message: "en producción hay que indicar la dirección de la tienda (Vercel)" });
    }
  });

// Nombre nuevo, y si no está, el anterior (avisando cuál renombrar).
const valores = { ...process.env };
const renombrar = [];
for (const [nuevo, anterior] of Object.entries(NOMBRES_ANTERIORES)) {
  if (valores[nuevo] === undefined && valores[anterior] !== undefined) {
    valores[nuevo] = valores[anterior];
    renombrar.push(`${anterior} → ${nuevo}`);
  }
}
if (valores.NODE_ENV === "test" && !valores.CLAVE_SESIONES) {
  valores.CLAVE_SESIONES = "secreto_de_test_solo_para_vitest_0123456789";
}

const resultado = esquema.safeParse(valores);
if (!resultado.success) {
  const lineas = resultado.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Variables de entorno inválidas (servidor/.env o el panel de Render):\n${lineas}`);
}
if (renombrar.length && valores.NODE_ENV !== "test") {
  console.warn(`⚠️  Variables con nombre anterior (funcionan, pero conviene renombrarlas):\n  ${renombrar.join("\n  ")}`);
}

const datos = resultado.data;

export const env = {
  ...datos,
  // Con Neon la conexión es siempre cifrada; en local, según BD_SSL.
  BD_SSL: datos.BD_SSL ? datos.BD_SSL.toLowerCase() === "true" : Boolean(datos.BD_URL_NEON),
  // Lista de direcciones permitidas (CORS).
  origenesPermitidos: datos.URL_FRONTEND_VERCEL.split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean),
  esProduccion: datos.NODE_ENV === "production",
  esTest: datos.NODE_ENV === "test",
  imagenesConfiguradas: Boolean(datos.CLOUDINARY_NOMBRE_NUBE && datos.CLOUDINARY_CLAVE_API && datos.CLOUDINARY_SECRETO_API),
  // Esquema efectivo: en tests se usa uno aparte que se recrea en cada corrida.
  schema: datos.NODE_ENV === "test" ? datos.BD_ESQUEMA_TEST : datos.BD_ESQUEMA,
};
