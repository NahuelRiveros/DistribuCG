import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cloudinary } from "../../../core/configuracion_servidor/cloudinary.js";
import { ARCHIVO_IMAGENES, leerImagenesCatalogo } from "./imagenes_catalogo.js";

// Ejecutar desde la raíz: npm --prefix servidor run imagenes:subir -- "<carpeta con _indice.json>"
// Sube cada foto a Cloudinary (cuenta del .env) y anota código → URL en imagenes_catalogo.json.
// Lo corre el usuario en la PC que tiene las fotos; el arranque del servidor solo lee ese JSON.
const CARPETA_CLOUDINARY = "distribucg/productos";
// La tienda muestra las fotos tal cual: se piden achicadas y en el formato más liviano que acepte el navegador.
const ENTREGA = [{ width: 600, height: 600, crop: "limit", fetch_format: "auto", quality: "auto" }];

// npm corre el script desde servidor/: una ruta relativa se toma desde donde se escribió el comando (INIT_CWD).
const argumento = process.argv.slice(2).find((a) => !a.startsWith("--"));
const carpeta = argumento && path.resolve(process.env.INIT_CWD ?? process.cwd(), argumento);
// --todas: vuelve a subir todo el índice (por ejemplo, si las fotos se borraron de Cloudinary).
const TODAS = process.argv.includes("--todas");
if (!carpeta) {
  console.error('❌ Indicá la carpeta: npm --prefix servidor run imagenes:subir -- "C:/ruta/para_cloudinary"');
  process.exit(1);
}
const { cloud_name, api_key, api_secret } = cloudinary.config();
if (!cloud_name || !api_key || !api_secret) {
  console.error("❌ Faltan CLOUDINARY_NOMBRE_CUENTA, CLOUDINARY_CLAVE_API o CLOUDINARY_SECRETO_API en servidor/.env.produccion");
  process.exit(1);
}

const indice = JSON.parse(await readFile(path.join(carpeta, "_indice.json"), "utf8"));
const imagenes = await leerImagenesCatalogo();
const guardar = () => writeFile(ARCHIVO_IMAGENES, JSON.stringify(Object.fromEntries(Object.entries(imagenes).sort()), null, 2) + "\n");
const pendientes = TODAS ? indice : indice.filter((foto) => foto.codigos.some((codigo) => !imagenes[codigo]));
console.log(`Subiendo ${pendientes.length} fotos a ${cloud_name}/${CARPETA_CLOUDINARY} (${indice.length - pendientes.length} ya estaban)...`);

let subidas = 0;
const fallidas = [];
let siguiente = 0;
async function trabajar() {
  while (siguiente < pendientes.length) {
    const foto = pendientes[siguiente++];
    try {
      // public_id = código del cliente: repetir la subida no crea copias. Con --todas pisa la que haya (overwrite).
      const resultado = await cloudinary.uploader.upload(path.join(carpeta, foto.archivo), {
        folder: CARPETA_CLOUDINARY, public_id: foto.codigos[0], overwrite: TODAS, resource_type: "image",
        // Se guarda hasta 1200 px: alcanza para el detalle y no ocupa espacio de más en el plan gratis.
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      });
      const url = cloudinary.url(resultado.public_id, { secure: true, version: resultado.version, transformation: ENTREGA });
      for (const codigo of foto.codigos) imagenes[codigo] = url;
      if (++subidas % 25 === 0) { await guardar(); console.log(`  ${subidas}/${pendientes.length}`); }
    } catch (error) {
      fallidas.push(`${foto.archivo}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 3 }, trabajar));
await guardar();
console.log(`✅ ${subidas} fotos subidas. imagenes_catalogo.json tiene ${Object.keys(imagenes).length} códigos.`);
if (fallidas.length) {
  console.warn(`⚠️ ${fallidas.length} no se subieron (volvé a correr el comando para reintentar):`);
  for (const f of fallidas.slice(0, 20)) console.warn(`  ${f}`);
  process.exitCode = 1;
}
