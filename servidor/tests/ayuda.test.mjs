import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todosLosTemas, contextoAyuda } from "../../frontend/src/core/modules/ayuda/registro_ayuda.js";
import { GRUPOS_AYUDA, temasVisibles, buscarTemas, agruparTemas, itemsPorPantalla } from "../../frontend/src/core/modules/ayuda/ayuda_temas.js";
import { permisosEfectivos } from "../../core/permisos_config.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function codigosDeLasSpecs() {
  const codigos = new Set();
  const recorrer = async (carpeta) => {
    for (const e of await readdir(carpeta, { withFileTypes: true })) {
      const ruta = path.join(carpeta, e.name);
      if (e.isDirectory()) await recorrer(ruta);
      else if (e.name.endsWith(".md")) for (const m of (await readFile(ruta, "utf8")).matchAll(/^\| ([A-Z]{3}-\d+b?) \|/gm)) codigos.add(m[1]);
    }
  };
  await recorrer(path.join(RAIZ, "docs", "specs"));
  return codigos;
}

const persona = (roles, permisos = []) => ({ usuario_id: 1, roles, permisos });
const VENDEDOR = persona(["vendedor"], ["pedidos.ver", "pedidos.gestionar"]);
const SUPERVISOR = persona(["supervisor"], ["pedidos.ver", "pedidos.gestionar", "cobros.gestionar", "productos.editar", "precios.editar"]);
const SOLO_PRECIOS = persona(["precios"], ["precios.editar"]);
const CLIENTE = persona(["cliente"]);
const ids = (temas) => temas.map((t) => t.id);

test("AYU-07 y AYU-08: cada tema está completo, cita reglas que existen y pantallas del menú", async () => {
  const codigos = await codigosDeLasSpecs();
  const vistos = new Set();
  assert.ok(todosLosTemas.length >= 15, "están los temas del core y los de la distribuidora");
  for (const t of todosLosTemas) {
    assert.match(t.id, /^[a-z0-9-]+$/, `id "${t.id}" para la dirección /panel/ayuda/<id>`);
    assert.ok(!vistos.has(t.id), `id repetido: ${t.id}`); vistos.add(t.id);
    assert.ok(GRUPOS_AYUDA.includes(t.grupo), `${t.id}: grupo desconocido "${t.grupo}"`);
    assert.ok(t.titulo && t.resumen, `${t.id}: falta título o resumen`);
    assert.ok(t.secciones?.length, `${t.id}: sin contenido`);
    for (const s of t.secciones) assert.ok(s.titulo && ([s.texto ?? []].flat().length || s.pasos?.length || s.ejemplo || s.consejo || s.problemas?.length), `${t.id} › ${s.titulo}: sección vacía`);
    for (const r of t.reglas ?? []) assert.ok(codigos.has(r), `${t.id} cita ${r}, que no está en docs/specs`);
    if (t.pantalla) assert.ok(contextoAyuda.items.has(t.pantalla), `${t.id}: la pantalla ${t.pantalla} no está en el menú del panel`);
  }
  for (const t of todosLosTemas) for (const r of t.relacionados ?? []) assert.ok(vistos.has(r), `${t.id} relaciona "${r}", que no existe`);
});

test("AYU-01: un cliente o alguien sin sesión no ve ninguna ayuda", () => {
  assert.deepEqual(temasVisibles(todosLosTemas, CLIENTE, contextoAyuda), []);
  assert.deepEqual(temasVisibles(todosLosTemas, null, contextoAyuda), []);
});

test("AYU-04: el vendedor ve pedidos y lista de carga, pero no precios, permisos, importación ni respaldo", () => {
  const vendedor = temasVisibles(todosLosTemas, VENDEDOR, contextoAyuda);
  for (const id of ["panel", "tienda-y-panel", "pedidos", "lista-carga"]) assert.ok(ids(vendedor).includes(id), `el vendedor ve ${id}`);
  for (const id of ["precio-iva", "actualizar-precios", "ajuste-masivo", "permisos", "personal", "importar", "respaldo", "cobros", "clientes"]) {
    assert.ok(!ids(vendedor).includes(id), `el vendedor no ve ${id}`);
  }
  const pedidos = vendedor.find((t) => t.id === "pedidos");
  assert.ok(pedidos.secciones.some((s) => s.titulo.startsWith("Paso a paso")), "puede cambiar estados: ve cómo avanzar");
  assert.ok(!pedidos.relacionados.includes("cobros"), "\"Relacionado\" no apunta a lo que no puede ver");
  // Sin "Cambiar estados", el paso a paso de avanzar el pedido desaparece del tema.
  const soloVer = temasVisibles(todosLosTemas, persona(["vendedor"], ["pedidos.ver"]), contextoAyuda).find((t) => t.id === "pedidos");
  assert.ok(!soloVer.secciones.some((s) => s.titulo.startsWith("Paso a paso")));
});

test("AYU-04: precios y ajuste masivo piden lo mismo que sus pantallas; el admin del sistema ve todo", () => {
  const supervisor = ids(temasVisibles(todosLosTemas, SUPERVISOR, contextoAyuda));
  for (const id of ["precio-iva", "ofertas", "ajuste-masivo", "actualizar-precios", "cobros", "respaldo"]) assert.ok(supervisor.includes(id), `el supervisor ve ${id}`);
  assert.ok(!supervisor.includes("permisos"), "sin \"Roles y permisos\" no ve su ayuda");
  // Con solo "Cambiar precios" no abre Artículos: no ve el ajuste masivo (vive ahí), sí Actualizar precios.
  const precios = ids(temasVisibles(todosLosTemas, SOLO_PRECIOS, contextoAyuda));
  assert.ok(precios.includes("actualizar-precios") && !precios.includes("ajuste-masivo"));
  // Como en la sesión real: el servidor le da todos los permisos al administrador del sistema.
  const superAdmin = persona(["super_admin"], permisosEfectivos(["super_admin"]));
  assert.equal(temasVisibles(todosLosTemas, superAdmin, contextoAyuda).length, todosLosTemas.length);
});

test("AYU-04: un tema de una pantalla que esta instalación no tiene no se muestra", () => {
  const temas = [{ id: "x", grupo: "Catálogo", titulo: "X", resumen: "x", pantalla: "/no-existe", secciones: [{ titulo: "a", texto: "b" }] }];
  assert.deepEqual(temasVisibles(temas, persona(["super_admin"], permisosEfectivos(["super_admin"])), contextoAyuda), []);
  assert.equal(itemsPorPantalla([{ items: [{ to: "/a", children: [{ to: "/b" }] }] }]).size, 2);
});

test("AYU-02: el buscador ignora acentos y mayúsculas, prioriza el título y nunca encuentra lo oculto", () => {
  const supervisor = temasVisibles(todosLosTemas, SUPERVISOR, contextoAyuda);
  assert.equal(buscarTemas(supervisor, "CATEGORÍAS")[0].id, "familias");
  assert.ok(ids(buscarTemas(supervisor, "precio 0")).includes("no-aparece"));
  assert.deepEqual(buscarTemas(supervisor, "zzz inexistente"), []);
  assert.equal(buscarTemas(supervisor, "  ").length, supervisor.length);
  const vendedor = temasVisibles(todosLosTemas, VENDEDOR, contextoAyuda);
  assert.ok(!ids(buscarTemas(vendedor, "ajuste masivo")).includes("ajuste-masivo"));
  assert.deepEqual(agruparTemas(supervisor).map((g) => g.grupo).filter((g) => g !== "Clientes"), GRUPOS_AYUDA.filter((g) => supervisor.some((t) => t.grupo === g) && g !== "Clientes"));
});
