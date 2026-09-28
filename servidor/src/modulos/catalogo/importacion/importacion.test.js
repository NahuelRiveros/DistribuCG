import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sugerirMapeo } from "compartido/importacion_catalogo.js";
import { crearApp } from "../../../app.js";
import { sequelize } from "../../../nucleo/db/sequelize.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../../tests/ayudantes.js";
import { leerCsv, leerPlanilla } from "./lector_planilla.js";
import { numero } from "./normalizar.js";

const app = crearApp();
let staff, otro;

beforeAll(async () => {
  await vaciarTablas("importacion_catalogo_lote", "importacion_catalogo", "usuario_rol", "usuario", "rol");
  await crearRoles();
  staff = await crearUsuario({ email: "staff@importa.com", roles: ["staff"] });
  otro = await crearUsuario({ email: "otro@importa.com", roles: ["staff"] });
});
beforeEach(() => vaciarTablas("importacion_catalogo_lote", "importacion_catalogo", "producto_imagen", "variante", "producto", "categoria"));
afterAll(() => sequelize.close());

const BASE = "/api/catalogo/importacion";
const CSV_INICIAL = [
  "Código;Producto;Presentación;Categoría;Precio;IVA",
  "A1;Yerba Playadito;500 g;Almacén > Infusiones;1.000,50;21",
  "A2;Yerba Playadito;1 kg;Almacén > Infusiones;1.900;10,5",
  "A3;Sin precio;;Almacén;abc;",
].join("\n");

function subir(ruta, csv, campos = {}, usuario = staff, nombre = "lista.csv") {
  let pedido = request(app).post(`${BASE}${ruta}`).set(...autorizacion(usuario)).attach("archivo", Buffer.from(csv), nombre);
  for (const [clave, valor] of Object.entries(campos)) pedido = pedido.field(clave, typeof valor === "string" ? valor : JSON.stringify(valor));
  return pedido;
}
const lote = (id, cuerpo, usuario = staff) => request(app).post(`${BASE}/${id}/lote`).set(...autorizacion(usuario)).send(cuerpo);

async function validarCsv(csv, { opciones = {}, mapeo } = {}) {
  const vista = await subir("/previsualizar", csv, { opciones });
  const id = randomUUID();
  const res = await subir("/validar", csv, { opciones, mapeo: mapeo ?? sugerirMapeo(vista.body.data.columnas), id });
  expect(res.status).toBe(200);
  return res.body.data;
}

async function productoPorNombre(nombre) {
  const res = await request(app).get(`/api/catalogo/productos?q=${encodeURIComponent(nombre)}`).set(...autorizacion(staff));
  return res.body.data.find((p) => p.nombre === nombre);
}

describe("lectura de archivos", () => {
  it("detecta el separador del CSV y respeta comillas", () => {
    expect(leerCsv('a;b\n"con ; adentro";"dice ""hola"""').filas).toEqual([["a", "b"], ["con ; adentro", 'dice "hola"']]);
    expect(leerCsv("a,b,c\n1,2,3").separador).toBe(",");
  });

  it("interpreta números con coma o punto decimal", () => {
    expect(numero("1.234,56", "coma", "Precio")).toBe(1234.56);
    expect(numero("$ 1,234.56", "punto", "Precio")).toBe(1234.56);
    expect(() => numero("1.234,56", "punto", "Precio")).toThrow("inválido");
  });

  it("la plantilla es un Excel que el mismo lector entiende", async () => {
    const res = await request(app).get(`${BASE}/plantilla`).set(...autorizacion(staff)).buffer(true).parse((r, cb) => {
      const partes = [];
      r.on("data", (p) => partes.push(p));
      r.on("end", () => cb(null, Buffer.concat(partes)));
    });
    expect(res.headers["content-type"]).toMatch(/spreadsheetml/);
    const leido = await leerPlanilla(res.body, "plantilla.xlsx", {});
    expect(leido.columnas.map((c) => c.nombre)).toEqual(["SKU", "Producto", "Presentación", "Categoría", "Precio", "IVA", "Marca"]);
    expect(leido.filas[0].valores[0]).toBe("000123");
    expect(sugerirMapeo(leido.columnas)).toMatchObject({ sku: "c1", producto: "c2", presentacion: "c3", categoria: "c4", precio: "c5", iva_porcentaje: "c6", marca: "c7" });
  });
});

describe("importación completa", () => {
  it("previsualiza, valida sin tocar el catálogo y crea por lotes", async () => {
    const vista = await subir("/previsualizar", CSV_INICIAL, { opciones: {} });
    expect(vista.body.data).toMatchObject({ total: 3, separador: ";" });

    const importacion = await validarCsv(CSV_INICIAL);
    expect(importacion.resumen).toEqual({ total: 3, crear: 2, actualizar: 0, sin_cambios: 0, omitir: 0, error: 1 });
    expect(importacion.muestra.find((f) => f.fila === 4).mensaje).toBe("Precio inválido para el formato de números elegido.");
    expect(await productoPorNombre("Yerba Playadito")).toBeUndefined(); // validar no carga nada

    // Sin confirmar, o con errores sin aceptar omitirlos, no se ejecuta
    expect((await lote(importacion.id, { indice: 0 })).body.codigo).toBe("FALTA_CONFIRMAR");
    expect((await lote(importacion.id, { indice: 0, confirmar: true })).status).toBe(409);

    const final = await lote(importacion.id, { indice: 0, confirmar: true, omitir_errores: true });
    expect(final.body.data).toMatchObject({ estado: "completado", siguiente_lote: 1 });
    expect(final.body.data.resultado).toMatchObject({ crear: 2, error: 1, productos_nuevos: 1, categorias_nuevas: 2 });

    const yerba = await productoPorNombre("Yerba Playadito");
    expect(yerba.categoria.nombre).toBe("Infusiones");
    expect(yerba.variantes.map((v) => [v.nombre, v.sku, v.precio, v.iva_porcentaje])).toEqual([
      ["500 g", "A1", "1000.50", "21.00"],
      ["1 kg", "A2", "1900.00", "10.50"],
    ]);

    // Repetir el lote (doble click, reintento) no duplica nada
    expect((await lote(importacion.id, { indice: 0, confirmar: true, omitir_errores: true })).status).toBe(200);
    expect((await productoPorNombre("Yerba Playadito")).variantes).toHaveLength(2);
  });

  it("actualiza precios por código y omite lo que no existe en modo 'solo actualizar'", async () => {
    const creada = await validarCsv(CSV_INICIAL);
    await lote(creada.id, { indice: 0, confirmar: true, omitir_errores: true });

    const csv = "SKU;Precio\na1;1100\nZZ;50";
    const importacion = await validarCsv(csv, { opciones: { modo: "actualizar" }, mapeo: { sku: "c1", precio: "c2" } });
    expect(importacion.resumen).toMatchObject({ actualizar: 1, omitir: 1 });
    await lote(importacion.id, { indice: 0, confirmar: true });

    const yerba = await productoPorNombre("Yerba Playadito");
    expect(yerba.variantes.find((v) => v.sku === "A1").precio).toBe("1100.00");
  });

  it("si la lista trae precio final, guarda el neto sin IVA", async () => {
    const csv = "SKU;Producto;Categoría;Precio\nB1;Agua;Bebidas;1210";
    const importacion = await validarCsv(csv, { opciones: { tipo_precio: "final" } });
    await lote(importacion.id, { indice: 0, confirmar: true });
    expect((await productoPorNombre("Agua")).variantes[0].precio).toBe("1000.00");
  });

  it("no pisa cambios hechos al catálogo después de validar", async () => {
    const creada = await validarCsv(CSV_INICIAL);
    await lote(creada.id, { indice: 0, confirmar: true, omitir_errores: true });

    const importacion = await validarCsv("SKU;Precio\nA1;2000", { opciones: { modo: "actualizar" }, mapeo: { sku: "c1", precio: "c2" } });
    const yerba = await productoPorNombre("Yerba Playadito");
    await request(app)
      .put(`/api/catalogo/productos/${yerba.id}`)
      .set(...autorizacion(staff))
      .send({ categoria_id: yerba.categoria_id, nombre: yerba.nombre, variantes: yerba.variantes.map((v) => ({ id: v.id, nombre: v.nombre, sku: v.sku, precio: v.sku === "A1" ? 1500 : v.precio })) });

    const final = await lote(importacion.id, { indice: 0, confirmar: true });
    expect(final.body.data.resultado).toMatchObject({ actualizar: 0, error: 1 });
    expect((await productoPorNombre("Yerba Playadito")).variantes.find((v) => v.sku === "A1").precio).toBe("1500.00");
  });

  it("el mismo id no se puede reusar con otro archivo, y cada usuario ve solo sus importaciones", async () => {
    const importacion = await validarCsv(CSV_INICIAL);
    const otroArchivo = await subir("/validar", "SKU;Precio\nX;1", { opciones: {}, mapeo: { sku: "c1", precio: "c2" }, id: importacion.id });
    expect(otroArchivo.status).toBe(409);

    expect((await request(app).get(`${BASE}/${importacion.id}`).set(...autorizacion(otro))).status).toBe(404);
    expect((await request(app).get(`${BASE}/historial`).set(...autorizacion(staff))).body.data).toHaveLength(1);
  });

  it("genera el informe CSV de todas las filas y permite cancelar", async () => {
    const importacion = await validarCsv(CSV_INICIAL);
    const informe = await request(app).get(`${BASE}/${importacion.id}/informe`).set(...autorizacion(staff));
    expect(informe.headers["content-type"]).toMatch(/text\/csv/);
    const lineas = informe.text.replace(/^\uFEFF/, "").trim().split("\r\n");
    expect(lineas).toHaveLength(4);
    expect(lineas[3]).toContain('"Error"');

    const cancelada = await request(app).post(`${BASE}/${importacion.id}/cancelar`).set(...autorizacion(staff));
    expect(cancelada.body.data.estado).toBe("cancelado");
    expect((await lote(importacion.id, { indice: 0, confirmar: true, omitir_errores: true })).body.codigo).toBe("IMPORTACION_CANCELADA");
  });

  it("rechaza archivos que no son planillas y pide asignar el precio", async () => {
    const pdf = await subir("/previsualizar", "%PDF", { opciones: {} }, staff, "lista.pdf");
    expect(pdf.status).toBe(400);
    const sinPrecio = await subir("/validar", CSV_INICIAL, { opciones: {}, mapeo: { sku: "c1", producto: "c2" }, id: randomUUID() });
    expect(sinPrecio.body.mensaje).toBe("Asigná la columna del precio.");
  });
});

describe("columna Stock", () => {
  const existencia = async (sku) => {
    const res = await request(app).get(`/api/stock/existencias?q=${sku}`).set(...autorizacion(staff));
    return res.body.data[0];
  };

  it("al crear activa el control de stock y registra la cantidad como movimiento de importación", async () => {
    const csv = "SKU;Producto;Categoría;Precio;Stock\nS1;Fideos;Almacén;500;24\nS2;Arroz;Almacén;700;";
    const importacion = await validarCsv(csv);
    await lote(importacion.id, { indice: 0, confirmar: true });

    expect(await existencia("S1")).toMatchObject({ controla_stock: true, cantidad: 24 });
    expect(await existencia("S2")).toMatchObject({ controla_stock: false }); // celda vacía: no controla

    const s1 = await existencia("S1");
    const historial = await request(app).get(`/api/stock/variantes/${s1.variante_id}/movimientos`).set(...autorizacion(staff));
    expect(historial.body.data[0]).toMatchObject({ tipo: "importacion", cantidad: 24, referencia_tipo: "importacion", referencia_id: importacion.id });
  });

  it("al actualizar registra solo la diferencia, y 'sin cambios' si es igual", async () => {
    const primera = await validarCsv("SKU;Producto;Categoría;Precio;Stock\nS1;Fideos;Almacén;500;24");
    await lote(primera.id, { indice: 0, confirmar: true });

    const csv = "SKU;Stock\nS1;20";
    const opciones = { modo: "actualizar", actualizar: ["stock"] };
    const segunda = await validarCsv(csv, { opciones, mapeo: { sku: "c1", stock: "c2" } });
    expect(segunda.resumen).toMatchObject({ actualizar: 1 });
    await lote(segunda.id, { indice: 0, confirmar: true });
    expect((await existencia("S1")).cantidad).toBe(20);

    const igual = await validarCsv("SKU;Stock\nS1;20", { opciones, mapeo: { sku: "c1", stock: "c2" } });
    expect(igual.resumen).toMatchObject({ sin_cambios: 1, actualizar: 0 });
  });

  it("rechaza stock con decimales y exige la columna si se pide actualizarlo", async () => {
    const decimales = await validarCsv("SKU;Producto;Categoría;Precio;Stock\nS1;Fideos;Almacén;500;2,5");
    expect(decimales.muestra[0].mensaje).toBe("Stock inválido: tiene que ser un número entero, 0 o más.");

    const sinColumna = await subir("/validar", "SKU;Precio\nS1;1", { opciones: { modo: "actualizar", actualizar: ["stock"] }, mapeo: { sku: "c1", precio: "c2" }, id: randomUUID() });
    expect(sinColumna.body.mensaje).toBe("Para actualizar el stock tenés que asignar su columna.");
  });
});
