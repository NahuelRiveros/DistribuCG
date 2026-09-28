import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { usarAlmacenImagenes } from "../../nucleo/imagenes.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";

const app = crearApp();
let staff;

// Almacén de imágenes falso: guarda en memoria lo que se sube y se borra.
const almacen = { subidas: [], borradas: [], fallar: false };
usarAlmacenImagenes({
  subir: async (buffer, { carpeta }) => {
    if (almacen.fallar) throw Object.assign(new Error("imagen inválida"), { http_code: 400 });
    const public_id = `${carpeta}/img-${almacen.subidas.length + 1}`;
    almacen.subidas.push(public_id);
    return { url: `https://cdn.test/${public_id}.webp`, public_id };
  },
  eliminar: async (public_id) => almacen.borradas.push(public_id),
});

const post = (url, body) => request(app).post(url).set(...autorizacion(staff)).send(body);
const precios = async (id) => (await request(app).get(`/api/catalogo/productos/${id}`).set(...autorizacion(staff))).body.data.variantes.map((v) => [v.precio, v.precio_anterior]);

beforeAll(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  staff = await crearUsuario({ email: "staff@precios.com", roles: ["staff"] });
});
afterAll(() => sequelize.close());

let almacenCat, bebidas, galletitas, agua;
beforeEach(async () => {
  await vaciarTablas("producto_imagen", "variante", "producto", "categoria");
  Object.assign(almacen, { subidas: [], borradas: [], fallar: false });
  almacenCat = (await post("/api/catalogo/categorias", { nombre: "Almacén" })).body.data;
  const dulces = (await post("/api/catalogo/categorias", { nombre: "Dulces", padre_id: almacenCat.id })).body.data;
  bebidas = (await post("/api/catalogo/categorias", { nombre: "Bebidas" })).body.data;
  galletitas = (await post("/api/catalogo/productos", {
    categoria_id: dulces.id,
    nombre: "Galletitas",
    variantes: [{ nombre: "Chica", precio: 1000, precio_anterior: 1200 }, { nombre: "Grande", precio: 333.33 }],
  })).body.data;
  agua = (await post("/api/catalogo/productos", { categoria_id: bebidas.id, nombre: "Agua", variantes: [{ precio: 500 }] })).body.data;
});

describe("Ajuste masivo de precios", () => {
  it("la vista previa muestra cuántas presentaciones cambian sin guardar nada", async () => {
    const res = await post("/api/catalogo/precios/ajuste", { porcentaje: "10", categoria_id: almacenCat.id, simular: true });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ cantidad: 2, aplicado: false });
    expect(res.body.data.ejemplos.map((e) => [e.presentacion, e.antes, e.despues])).toEqual([
      ["Chica", "1000.00", "1100.00"],
      ["Grande", "333.33", "366.66"],
    ]);
    expect(await precios(galletitas.id)).toEqual([["1000.00", "1200.00"], ["333.33", null]]);
  });

  it("aplica a la categoría con sus subcategorías y ajusta también el precio de oferta", async () => {
    const res = await post("/api/catalogo/precios/ajuste", { porcentaje: "10", categoria_id: almacenCat.id });
    expect(res.body.data).toMatchObject({ cantidad: 2, aplicado: true });
    expect(await precios(galletitas.id)).toEqual([["1100.00", "1320.00"], ["366.66", null]]);
    expect(await precios(agua.id)).toEqual([["500.00", null]]); // otra categoría: no cambia
  });

  it("baja precios de todo el catálogo con coma decimal", async () => {
    const res = await post("/api/catalogo/precios/ajuste", { porcentaje: "-12,5", todo_el_catalogo: true });
    expect(res.body.data.cantidad).toBe(3);
    expect(await precios(agua.id)).toEqual([["437.50", null]]);
  });

  it("exige elegir alcance y un porcentaje razonable", async () => {
    const sinAlcance = await post("/api/catalogo/precios/ajuste", { porcentaje: 10 });
    expect(sinAlcance.status).toBe(400);
    expect(sinAlcance.body.detalles[0].mensaje).toBe("Elegí una categoría o confirmá aplicar a todo el catálogo");

    const cero = await post("/api/catalogo/precios/ajuste", { porcentaje: 0, todo_el_catalogo: true });
    expect(cero.body.detalles[0].mensaje).toBe("El porcentaje no puede ser 0");
    const muchaBaja = await post("/api/catalogo/precios/ajuste", { porcentaje: -95, todo_el_catalogo: true });
    expect(muchaBaja.body.detalles[0].mensaje).toBe("No se puede bajar más de 90 %");
  });
});

describe("Imágenes de producto", () => {
  const subir = (productoId, nombre = "foto.png", contenido = "imagen-falsa") =>
    request(app).post(`/api/catalogo/productos/${productoId}/imagenes`).set(...autorizacion(staff)).attach("imagen", Buffer.from(contenido), nombre);

  it("sube imágenes en orden y aparecen en el producto", async () => {
    expect((await subir(agua.id)).status).toBe(201);
    const segunda = await subir(agua.id, "otra.jpg");
    expect(segunda.body.data).toMatchObject({ url: "https://cdn.test/productos/img-2.webp", orden: 1, alt: "Agua" });

    const producto = (await request(app).get("/api/catalogo/productos/agua")).body.data;
    expect(producto.imagenes.map((i) => i.orden)).toEqual([0, 1]);
  });

  it("rechaza archivos que no son imágenes o demasiado grandes", async () => {
    const pdf = await subir(agua.id, "lista.pdf");
    expect(pdf.status).toBe(400);
    expect(pdf.body.mensaje).toBe("Solo se aceptan imágenes JPG, PNG, WEBP, AVIF o GIF.");

    const grande = await subir(agua.id, "enorme.png", "x".repeat(5 * 1024 * 1024 + 1));
    expect(grande.status).toBe(413);
    expect(grande.body.mensaje).toBe("El archivo supera 5 MB.");

    almacen.fallar = true;
    const rota = await subir(agua.id);
    expect(rota.status).toBe(400);
    expect(rota.body.mensaje).toMatch(/No se pudo procesar la imagen/);
  });

  it("agrega por URL solo con https", async () => {
    const ok = await post(`/api/catalogo/productos/${agua.id}/imagenes/url`, { url: "https://otra-web.com/agua.jpg" });
    expect(ok.status).toBe(201);
    const inseguro = await post(`/api/catalogo/productos/${agua.id}/imagenes/url`, { url: "javascript:alert(1)" });
    expect(inseguro.status).toBe(400);
  });

  it("reordena y elimina (también del almacén)", async () => {
    const a = (await subir(agua.id)).body.data;
    const b = (await subir(agua.id)).body.data;

    const orden = await request(app).put(`/api/catalogo/productos/${agua.id}/imagenes/orden`).set(...autorizacion(staff)).send({ ids: [b.id, a.id] });
    expect(orden.body.data.map((i) => i.id)).toEqual([b.id, a.id]);
    const incompleto = await request(app).put(`/api/catalogo/productos/${agua.id}/imagenes/orden`).set(...autorizacion(staff)).send({ ids: [b.id] });
    expect(incompleto.status).toBe(400);

    expect((await request(app).delete(`/api/catalogo/productos/${agua.id}/imagenes/${a.id}`).set(...autorizacion(staff))).status).toBe(204);
    expect(almacen.borradas).toEqual(["productos/img-1"]);
    // No se puede borrar una imagen usando otro producto en la URL
    expect((await request(app).delete(`/api/catalogo/productos/${galletitas.id}/imagenes/${b.id}`).set(...autorizacion(staff))).status).toBe(404);
  });

  it("un visitante no puede subir imágenes", async () => {
    const res = await request(app).post(`/api/catalogo/productos/${agua.id}/imagenes`).attach("imagen", Buffer.from("x"), "a.png");
    expect(res.status).toBe(401);
  });
});
