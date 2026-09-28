// Alta y verificación de clientes (ver skill /nuevo-cliente).
//
//   npm run cliente:nuevo -- <id> --nombre "Ferretería López" [--activar]
//   npm run cliente:verificar [-- <id>]
//
// "nuevo" copia frontend/src/clientes/demo (la plantilla) y deja marcado con [COMPLETAR]
// todo lo que falta. "verificar" busca lo pendiente y los datos de ejemplo, y termina con
// error si el cliente todavía no está listo para publicar.
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENTES = join(RAIZ, "frontend", "src", "clientes");
const CONFIG = join(RAIZ, "proyecto.config.js");
const PLANTILLA = "demo";
const ARCHIVOS = ["index.js", "marca.js", "tema.js", "home.js", "navbar.js", "footer.js"];

// Textos que indican que algo quedó sin completar o es de ejemplo.
const PENDIENTES = [
  { patron: /\[COMPLETAR[^\]]*\]|\[Completar[^\]]*\]/g, motivo: "dato sin completar" },
  { patron: /ejemplo\.com/g, motivo: "email de ejemplo" },
  { patron: /5490000000000/g, motivo: "WhatsApp de ejemplo" },
  { patron: /Tienda Demo/g, motivo: "nombre del cliente demo" },
];

const leer = (ruta) => readFileSync(ruta, "utf8");
const salir = (mensaje) => {
  console.error(`❌ ${mensaje}`);
  process.exit(1);
};

function argumentos() {
  const [comando, ...resto] = process.argv.slice(2);
  const opciones = { comando, id: null, nombre: null, activar: false };
  for (let i = 0; i < resto.length; i++) {
    if (resto[i] === "--nombre") opciones.nombre = resto[++i];
    else if (resto[i] === "--activar") opciones.activar = true;
    else if (!opciones.id) opciones.id = resto[i];
  }
  return opciones;
}

const clienteActivo = () => leer(CONFIG).match(/cliente:\s*"([^"]+)"/)?.[1];

function activar(id) {
  const config = leer(CONFIG);
  writeFileSync(CONFIG, config.replace(/cliente:\s*"[^"]+"/, `cliente: "${id}"`));
  console.log(`✅ proyecto.config.js → cliente: "${id}"`);
}

function nuevo({ id, nombre, activar: activarlo }) {
  if (!id || !/^[a-z][a-z0-9_]{1,39}$/.test(id)) {
    salir('Indicá un id en minúsculas, sin espacios ni acentos (ej: ferreteria_lopez). Uso: npm run cliente:nuevo -- ferreteria_lopez --nombre "Ferretería López"');
  }
  const destino = join(CLIENTES, id);
  if (existsSync(destino)) salir(`Ya existe frontend/src/clientes/${id}/: elegí otro id o editá ese cliente.`);

  cpSync(join(CLIENTES, PLANTILLA), destino, { recursive: true });

  const reemplazar = (archivo, pares) => {
    const ruta = join(destino, archivo);
    let texto = leer(ruta);
    for (const [de, a] of pares) texto = texto.replace(de, a);
    writeFileSync(ruta, texto);
  };
  const nombreFinal = nombre?.trim() || "[COMPLETAR nombre]";
  reemplazar("index.js", [[`id: "${PLANTILLA}"`, `id: "${id}"`]]);
  reemplazar("marca.js", [
    [/nombre: "[^"]*"/, `nombre: "${nombreFinal}"`],
    [/nombre_corto: "[^"]*"/, `nombre_corto: "${nombreFinal.split(" ")[0]}"`],
    [/razon_social: "[^"]*"/, 'razon_social: "[COMPLETAR razón social]"'],
    [/rubro: "[^"]*"/, 'rubro: "[COMPLETAR rubro]"'],
    [/tagline: "[^"]*"/, 'tagline: "[COMPLETAR frase corta]"'],
  ]);

  console.log(`✅ Cliente creado en frontend/src/clientes/${id}/ (copia de "${PLANTILLA}")`);
  if (activarlo) activar(id);
  console.log("\nQueda por completar (npm run cliente:verificar lo lista):");
  console.log("  marca.js, tema.js (colores), home.js, navbar.js, footer.js y el logo en assets/");
}

function verificar({ id }) {
  const cliente = id ?? clienteActivo();
  const carpeta = join(CLIENTES, cliente);
  const errores = [];
  const avisos = [];

  if (!existsSync(carpeta)) salir(`No existe frontend/src/clientes/${cliente}/. Clientes: ${readdirSync(CLIENTES).filter((d) => !d.includes(".")).join(", ")}`);
  console.log(`Verificando el cliente "${cliente}"${cliente === clienteActivo() ? " (activo)" : ""}\n`);

  for (const archivo of ARCHIVOS) {
    const ruta = join(carpeta, archivo);
    if (!existsSync(ruta)) {
      errores.push(`Falta ${archivo}`);
      continue;
    }
    const texto = leer(ruta);
    for (const { patron, motivo } of PENDIENTES) {
      for (const coincidencia of texto.match(patron) ?? []) errores.push(`${archivo}: ${motivo} → ${coincidencia}`);
    }
  }
  if (!existsSync(join(carpeta, "index.js")) || !leer(join(carpeta, "index.js")).includes(`id: "${cliente}"`)) {
    errores.push(`index.js: el id tiene que ser "${cliente}"`);
  }
  const logo = leer(join(carpeta, "marca.js")).match(/import logo from "\.\/(assets\/[^"]+)"/)?.[1];
  if (!logo || !existsSync(join(carpeta, logo))) errores.push("marca.js: el logo no existe en assets/");
  else if (cliente !== PLANTILLA && existsSync(join(CLIENTES, PLANTILLA, logo)) && leer(join(carpeta, logo)) === leer(join(CLIENTES, PLANTILLA, logo))) {
    avisos.push("El logo es el mismo de la plantilla demo: reemplazalo por el del cliente");
  }
  if (cliente !== PLANTILLA && leer(join(carpeta, "tema.js")) === leer(join(CLIENTES, PLANTILLA, "tema.js"))) {
    avisos.push("tema.js tiene los colores de la plantilla demo");
  }
  if (cliente !== clienteActivo()) avisos.push(`No es el cliente activo: proyecto.config.js dice cliente: "${clienteActivo()}"`);
  if (/EJEMPLO/.test(leer(CONFIG))) {
    avisos.push("proyecto.config.js → pagos tiene datos EJEMPLO (son los iniciales: cargá los reales en el panel, Configuración)");
  }
  // Solo se mira que exista, nunca el contenido (tiene secretos).
  if (!existsSync(join(RAIZ, "servidor", ".env"))) avisos.push("Falta servidor/.env (copiar servidor/.env.example y completarlo)");

  for (const e of errores) console.log(`❌ ${e}`);
  for (const a of avisos) console.log(`⚠️  ${a}`);
  if (errores.length === 0) console.log(avisos.length ? "\n✅ Sin datos pendientes (revisá los avisos)." : "\n✅ Listo para publicar.");
  process.exit(errores.length ? 1 : 0);
}

const opciones = argumentos();
if (opciones.comando === "nuevo") nuevo(opciones);
else if (opciones.comando === "verificar") verificar(opciones);
else if (opciones.comando === "activar") opciones.id ? activar(opciones.id) : salir("Uso: npm run cliente:activar -- <id>");
else salir("Comandos: nuevo <id> --nombre \"...\" [--activar] | verificar [id] | activar <id>");
