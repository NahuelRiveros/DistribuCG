// Revisa servidor/.env y frontend/.env contra sus .env.example, SIN mostrar ningún valor:
// solo nombres y si están completos. Uso: npm run env:verificar
//
//   ✅ bien   ⚠️ nombre anterior (renombrar)   🗑️ no se usa (se puede borrar)   ❌ falta o está vacía
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

// Nombre anterior → nombre nuevo (los mismos que acepta servidor/src/nucleo/env.js).
const ANTERIORES = {
  NEON_DATABASE_URL: "BD_URL_NEON",
  DB_HOST: "BD_HOST",
  DB_PORT: "BD_PUERTO",
  DB_NAME: "BD_NOMBRE",
  DB_USER: "BD_USUARIO",
  DB_PASS: "BD_CONTRASENA",
  DB_SSL: "BD_SSL",
  DB_SCHEMA: "BD_ESQUEMA",
  DB_SCHEMA_TEST: "BD_ESQUEMA_TEST",
  JWT_SECRET: "CLAVE_SESIONES",
  JWT_EXPIRA: "DURACION_SESION",
  LIMITE_LOGIN: "INTENTOS_LOGIN",
  CORS_ORIGIN: "URL_FRONTEND_VERCEL",
  CLOUDINARY_CLOUD_NAME: "CLOUDINARY_NOMBRE_NUBE",
  CLOUDINARY_API_KEY: "CLOUDINARY_CLAVE_API",
  CLOUDINARY_API_SECRET: "CLOUDINARY_SECRETO_API",
  SUPERADMIN_PASSWORD: "SUPERADMIN_CONTRASENA",
  // Ya no se lee: sin renombrar, la tienda usa la API local (http://localhost:3001/api).
  VITE_API_URL: "VITE_URL_API_RENDER",
};

/** { NOMBRE: valor } de un archivo .env (el valor nunca se imprime). */
function leerEnv(ruta) {
  const variables = {};
  for (const linea of readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (m) variables[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return variables;
}

function revisar({ nombre, archivo, ejemplo, obligatorias }) {
  const ruta = join(RAIZ, archivo);
  console.log(`\n── ${nombre} (${archivo}) ──`);
  if (!existsSync(ruta)) {
    console.log(`❌ No existe. Copiá ${ejemplo} como ${archivo} y completalo.`);
    return 1;
  }
  const esperadas = Object.keys(leerEnv(join(RAIZ, ejemplo)));
  const actuales = leerEnv(ruta);
  let problemas = 0;

  for (const [clave, valor] of Object.entries(actuales)) {
    if (esperadas.includes(clave)) console.log(`✅ ${clave}${valor ? "" : " (vacía)"}`);
    else if (ANTERIORES[clave]) {
      console.log(`⚠️  ${clave} → renombrar a ${ANTERIORES[clave]}`);
      problemas++;
    } else console.log(`🗑️  ${clave} → este proyecto no la usa (se puede borrar)`);
  }
  // Presente con el nombre nuevo o con el anterior (funciona igual, ya se avisó arriba).
  const valorDe = (clave) => actuales[clave] ?? actuales[Object.keys(ANTERIORES).find((a) => ANTERIORES[a] === clave)];
  for (const { claves, mensaje, valida = Boolean } of obligatorias) {
    if (!claves.some((c) => valida(valorDe(c) ?? ""))) {
      console.log(`❌ ${mensaje}`);
      problemas++;
    }
  }
  return problemas;
}

const problemas =
  revisar({
    nombre: "Servidor",
    archivo: "servidor/.env",
    ejemplo: "servidor/.env.example",
    obligatorias: [
      { claves: ["BD_URL_NEON", "BD_NOMBRE"], mensaje: "Falta la base de datos: BD_URL_NEON (Neon) o BD_NOMBRE (Postgres local)" },
      { claves: ["CLAVE_SESIONES"], valida: (v) => v.length >= 32, mensaje: "CLAVE_SESIONES falta o tiene menos de 32 caracteres" },
    ],
  }) +
  revisar({
    nombre: "Frontend",
    archivo: "frontend/.env",
    ejemplo: "frontend/.env.example",
    obligatorias: [{ claves: ["VITE_URL_API_RENDER"], mensaje: "Falta VITE_URL_API_RENDER (en tu PC: http://localhost:3001/api)" }],
  });

console.log(problemas ? `\n${problemas} cosa(s) para corregir.` : "\n✅ Todo en orden.");
process.exit(problemas ? 1 : 0);
