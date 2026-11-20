import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { sequelize, DB_SCHEMA } from "../../../core/database/sequelize.js";
import { filasRespaldo, armarCsvRespaldo, indiceFotosRespaldo, urlOriginal } from "../services/respaldo_catalogo_service.js";
import { hoyArgentina } from "../services/importacion/lista_cliente.js";

// Ejecutar desde la raíz: npm --prefix servidor run catalogo:respaldo [-- "<carpeta>"]
// CAT-66: SOLO LEE la base de .env.produccion. Deja en la carpeta (por defecto respaldo-catalogo-AAAA-MM-DD):
//   catalogo.csv            la misma planilla del botón del panel
//   fotos/<código>.jpg      cada foto en su tamaño guardado (hasta 1200 px)
//   fotos/_indice.json      para restaurarlas: npm --prefix servidor run imagenes:subir -- "<carpeta>/fotos" --todas
// Se puede cortar y volver a correr: las fotos ya bajadas no se piden de nuevo.
const argumento = process.argv.slice(2).find((a) => !a.startsWith("--"));
const carpeta = path.resolve(process.env.INIT_CWD ?? process.cwd(), argumento ?? `respaldo-catalogo-${hoyArgentina()}`);
const carpetaFotos = path.join(carpeta, "fotos");
const existe = (archivo) => access(archivo).then(() => true, () => false);

try {
  console.log(`Leyendo el catálogo (esquema ${DB_SCHEMA})...`);
  const filas = await filasRespaldo();
  await mkdir(carpetaFotos, { recursive: true });
  await writeFile(path.join(carpeta, "catalogo.csv"), armarCsvRespaldo(filas, { conCostos: true }));
  const indice = indiceFotosRespaldo(filas);
  await writeFile(path.join(carpetaFotos, "_indice.json"), JSON.stringify(indice, null, 2) + "\n");
  console.log(`✅ catalogo.csv: ${filas.length} presentaciones. Bajando ${indice.length} fotos...`);

  let bajadas = 0, yaEstaban = 0, siguiente = 0;
  const fallidas = [];
  async function trabajar() {
    while (siguiente < indice.length) {
      const foto = indice[siguiente++];
      const destino = path.join(carpetaFotos, foto.archivo);
      if (await existe(destino)) { yaEstaban++; continue; }
      try {
        const r = await fetch(urlOriginal(foto.imagen_origen), { signal: AbortSignal.timeout(30000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        await writeFile(destino, Buffer.from(await r.arrayBuffer()));
        if (++bajadas % 100 === 0) console.log(`  ${bajadas + yaEstaban}/${indice.length}`);
      } catch (error) {
        fallidas.push(`${foto.archivo} (${foto.producto}): ${error.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, trabajar));
  console.log(`✅ Fotos: ${bajadas} bajadas, ${yaEstaban} ya estaban. Respaldo en ${carpeta}`);
  if (fallidas.length) {
    console.warn(`⚠️ ${fallidas.length} fotos no se bajaron (volvé a correr el comando para reintentar):`);
    for (const f of fallidas.slice(0, 20)) console.warn(`  ${f}`);
    process.exitCode = 1;
  }
} finally {
  await sequelize.close();
}
