import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { asignarImagenesCatalogo, leerImagenesCatalogo } from "../src/modulos/eccomerce_distribuidora/seed/imagenes_catalogo.js";
import { retirarProductos } from "../src/modulos/eccomerce_distribuidora/seed/completar_productos_distribuidora.js";

// Modelo en memoria: findAll/update con where de igualdad, listas (IN) y null.
function modelo(filas) {
  const cumple = (fila, where = {}) => Object.entries(where).every(([campo, valor]) =>
    Array.isArray(valor) ? valor.includes(fila[campo]) : fila[campo] === valor);
  return {
    filas,
    async findAll({ where, attributes }) {
      return filas.filter((f) => cumple(f, where)).map((f) => (attributes ? Object.fromEntries(attributes.map((a) => [a, f[a]])) : { ...f }));
    },
    async update(valores, { where }) {
      const afectadas = filas.filter((f) => cumple(f, where));
      for (const f of afectadas) Object.assign(f, valores);
      return [afectadas.length];
    },
  };
}

const URL_A = "https://res.cloudinary.com/demo/image/upload/v1/distribucg/productos/000100";
const URL_B = "https://res.cloudinary.com/demo/image/upload/v1/distribucg/productos/000200";

function catalogoConFotos() {
  return {
    ProductoDistribuidora: modelo([
      { id: 1, nombre: "Colgate Herbal", imagen_url: null, fecha_baja: null },
      { id: 2, nombre: "Aceite Natura", imagen_url: "https://res.cloudinary.com/demo/a-mano.jpg", fecha_baja: null },
      { id: 3, nombre: "Retirado", imagen_url: null, fecha_baja: new Date("2026-10-01") },
      { id: 4, nombre: "Sin código conocido", imagen_url: null, fecha_baja: null },
    ]),
    VariedadDistribuidora: modelo([
      { producto_id: 1, cod_ref: "000200", fecha_baja: null },
      { producto_id: 1, cod_ref: "000100", fecha_baja: null },
      { producto_id: 2, cod_ref: "000300", fecha_baja: null },
      { producto_id: 3, cod_ref: "000400", fecha_baja: null },
      { producto_id: 4, cod_ref: "999999", fecha_baja: null },
    ]),
  };
}

test("fotos del catálogo: asigna por código solo a vigentes sin foto, con el código más bajo", async () => {
  const modelos = catalogoConFotos();
  const imagenes = { "000100": URL_A, "000200": URL_B, "000300": URL_B, "000400": URL_A };
  assert.deepEqual(await asignarImagenesCatalogo(modelos, imagenes), { asignadas: 1 });
  const [colgate, aceite, retirado, sinCodigo] = modelos.ProductoDistribuidora.filas;
  assert.equal(colgate.imagen_url, URL_A);
  assert.equal(aceite.imagen_url, "https://res.cloudinary.com/demo/a-mano.jpg", "no pisa una foto cargada a mano");
  assert.equal(retirado.imagen_url, null, "no toca artículos dados de baja");
  assert.equal(sinCodigo.imagen_url, null);
  // Repetirlo no cambia nada: ya no quedan artículos sin foto con código conocido.
  assert.deepEqual(await asignarImagenesCatalogo(modelos, imagenes), { asignadas: 0 });
});

test("fotos del catálogo: sin códigos no consulta la base", async () => {
  const modelos = { ProductoDistribuidora: { findAll: () => assert.fail("no debe consultar") }, VariedadDistribuidora: { findAll: () => assert.fail("no debe consultar") } };
  assert.deepEqual(await asignarImagenesCatalogo(modelos, {}), { asignadas: 0 });
});

test("fotos del catálogo: el JSON solo acepta URLs HTTPS de Cloudinary", async () => {
  const carpeta = await mkdtemp(path.join(tmpdir(), "imagenes-catalogo-"));
  try {
    const archivo = path.join(carpeta, "imagenes.json");
    await writeFile(archivo, JSON.stringify({
      "000100": URL_A, "000101": "http://res.cloudinary.com/x.jpg", "000102": "https://otro.example/x.jpg",
      "000103": "javascript:alert(1)", "000104": `https://res.cloudinary.com/${"a".repeat(500)}`, " ": URL_B,
    }));
    assert.deepEqual(await leerImagenesCatalogo(archivo), { "000100": URL_A });
    assert.deepEqual(await leerImagenesCatalogo(path.join(carpeta, "no-existe.json")), {});
    await writeFile(archivo, "{ roto");
    await assert.rejects(() => leerImagenesCatalogo(archivo), /no es un JSON válido/);
  } finally {
    await rm(carpeta, { recursive: true, force: true });
  }
});

function catalogoParaRetirar() {
  return {
    CategoriaDistribuidora: modelo([
      { id: 1, nombre: "Almacén", slug: "almacen", padre_id: null, fecha_baja: null },
      { id: 2, nombre: "Galletitas", slug: "almacen-galletitas", padre_id: 1, fecha_baja: null },
    ]),
    ProductoDistribuidora: modelo([
      { id: 10, nombre: "9 de Oro Agridulces 200 g", categoria_id: 2, activo: true, fecha_baja: null },
      { id: 11, nombre: "Criollitas Original", categoria_id: 2, activo: false, fecha_baja: null },
      { id: 12, nombre: "Galletitas del Cliente", categoria_id: 2, activo: true, fecha_baja: null },
      { id: 13, nombre: "Ya Retirada", categoria_id: 2, activo: false, fecha_baja: new Date("2026-10-01") },
    ]),
    VariedadDistribuidora: modelo([
      { producto_id: 11, cod_ref: "000555", fecha_baja: null },
      { producto_id: 10, cod_ref: null, fecha_baja: null },
    ]),
  };
}
const SEED = { "Almacén › Galletitas": [{ nombre: "9 de Oro Agridulces 200 g" }, { nombre: "CRIOLLITAS original" }, { nombre: "Ya Retirada" }] };

test("retiro del catálogo demo: sin aplicar solo cuenta y no escribe", async () => {
  const modelos = catalogoParaRetirar();
  assert.deepEqual(await retirarProductos(modelos, SEED), { retirados: 1, conservados: 1 });
  assert.ok(modelos.ProductoDistribuidora.filas.every((p) => p.id === 13 || p.fecha_baja === null));
});

test("retiro del catálogo demo: da de baja los del seed y conserva los que tienen código del cliente", async () => {
  const modelos = catalogoParaRetirar();
  assert.deepEqual(await retirarProductos(modelos, SEED, undefined, { aplicar: true }), { retirados: 1, conservados: 1 });
  const [demo, conCodigo, delCliente] = modelos.ProductoDistribuidora.filas;
  assert.ok(demo.fecha_baja instanceof Date);
  assert.equal(demo.activo, false);
  assert.equal(conCodigo.fecha_baja, null, "un artículo con código interno es del cliente aunque se llame igual");
  assert.equal(delCliente.fecha_baja, null, "lo que no está en el seed no se toca");
  assert.deepEqual(await retirarProductos(modelos, SEED, undefined, { aplicar: true }), { retirados: 0, conservados: 1 });
});
