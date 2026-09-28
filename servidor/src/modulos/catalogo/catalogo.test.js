import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";

const app = crearApp();
let admin, staff, cliente, superAdmin;

beforeAll(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  admin = await crearUsuario({ email: "admin@catalogo.com", roles: ["admin"] });
  staff = await crearUsuario({ email: "staff@catalogo.com", roles: ["staff"] });
  cliente = await crearUsuario({ email: "cliente@catalogo.com", roles: ["cliente"] });
  superAdmin = await crearUsuario({ email: "super@catalogo.com", roles: ["super_admin"] });
});
beforeEach(() => vaciarTablas("producto_imagen", "variante", "producto", "categoria"));
afterAll(() => sequelize.close());

// ── Ayudantes ──
const api = {
  get: (url, usuario) => (usuario ? request(app).get(url).set(...autorizacion(usuario)) : request(app).get(url)),
  post: (url, body, usuario = staff) => request(app).post(url).set(...autorizacion(usuario)).send(body),
  put: (url, body, usuario = staff) => request(app).put(url).set(...autorizacion(usuario)).send(body),
  patch: (url, body, usuario = staff) => request(app).patch(url).set(...autorizacion(usuario)).send(body),
  delete: (url, usuario = staff) => request(app).delete(url).set(...autorizacion(usuario)),
};

async function nuevaCategoria(nombre, padre_id = null) {
  const res = await api.post("/api/catalogo/categorias", { nombre, padre_id });
  expect(res.status).toBe(201);
  return res.body.data;
}

async function nuevoProducto(categoria_id, extra = {}) {
  const res = await api.post("/api/catalogo/productos", {
    categoria_id,
    nombre: "Galletitas Oreo",
    marca: "Oreo",
    variantes: [
      { nombre: "118 g", sku: "ORE-118", precio: 1000 },
      { nombre: "Familiar 300 g", sku: "ORE-300", precio: 2250.5, iva_porcentaje: 10.5 },
    ],
    ...extra,
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

describe("Categorías", () => {
  it("crea raíz y subcategoría con slug automático", async () => {
    const almacen = await nuevaCategoria("Almacén");
    const galletitas = await nuevaCategoria("Galletitas Dulces", almacen.id);
    expect(almacen.slug).toBe("almacen");
    expect(galletitas).toMatchObject({ padre_id: almacen.id, slug: "galletitas-dulces" });
  });

  it("no repite el nombre en el mismo nivel (sin importar mayúsculas), pero sí en otro", async () => {
    const almacen = await nuevaCategoria("Almacén");
    const duplicada = await api.post("/api/catalogo/categorias", { nombre: "ALMACÉN" });
    expect(duplicada.status).toBe(409);
    expect(duplicada.body.codigo).toBe("CATEGORIA_DUPLICADA");

    const otroNivel = await api.post("/api/catalogo/categorias", { nombre: "Almacén", padre_id: almacen.id });
    expect(otroNivel.status).toBe(201);
    expect(otroNivel.body.data.slug).toBe("almacen-2");
  });

  it("rechaza un padre inexistente y los ciclos", async () => {
    const inexistente = await api.post("/api/catalogo/categorias", { nombre: "X", padre_id: 999 });
    expect(inexistente.status).toBe(400);
    expect(inexistente.body.detalles[0].campo).toBe("padre_id");

    const a = await nuevaCategoria("A");
    const b = await nuevaCategoria("B", a.id);
    const ciclo = await api.put(`/api/catalogo/categorias/${a.id}`, { nombre: "A", padre_id: b.id });
    expect(ciclo.status).toBe(400);
    expect(ciclo.body.detalles[0].mensaje).toMatch(/dentro de sí misma/);
  });

  it("no deja eliminar una categoría con productos o subcategorías", async () => {
    const almacen = await nuevaCategoria("Almacén");
    const galletitas = await nuevaCategoria("Galletitas", almacen.id);
    await nuevoProducto(galletitas.id);

    const conSub = await api.delete(`/api/catalogo/categorias/${almacen.id}`);
    expect(conSub.body.codigo).toBe("CATEGORIA_CON_SUBCATEGORIAS");
    const conProductos = await api.delete(`/api/catalogo/categorias/${galletitas.id}`);
    expect(conProductos.status).toBe(409);
    expect(conProductos.body.mensaje).toMatch(/1 producto/);
  });

  it("elimina (baja lógica) una categoría vacía y permite reutilizar el nombre", async () => {
    const vacia = await nuevaCategoria("Temporada");
    expect((await api.delete(`/api/catalogo/categorias/${vacia.id}`)).status).toBe(204);

    const lista = await api.get("/api/catalogo/categorias");
    expect(lista.body.data.map((c) => c.nombre)).not.toContain("Temporada");
    expect((await api.post("/api/catalogo/categorias", { nombre: "Temporada" })).status).toBe(201);
  });

  it("solo admin/staff/super_admin gestionan; el listado es público", async () => {
    expect((await request(app).post("/api/catalogo/categorias").send({ nombre: "X" })).status).toBe(401);
    expect((await api.post("/api/catalogo/categorias", { nombre: "X" }, cliente)).status).toBe(403);
    expect((await api.post("/api/catalogo/categorias", { nombre: "Y" }, superAdmin)).status).toBe(201);
    expect((await request(app).get("/api/catalogo/categorias")).status).toBe(200);
  });
});

describe("Categorías en el menú de la tienda", () => {
  it("se marcan para el menú al crearlas o editarlas, y el público lo ve", async () => {
    const mujer = (await api.post("/api/catalogo/categorias", { nombre: "Mujer", en_menu: true })).body.data;
    const hombre = await nuevaCategoria("Hombre");
    expect(mujer.en_menu).toBe(true);
    expect(hombre.en_menu).toBe(false);

    await api.put(`/api/catalogo/categorias/${hombre.id}`, { nombre: "Hombre", en_menu: true, orden: 2 });
    const publico = (await api.get("/api/catalogo/categorias")).body.data;
    expect(publico.filter((c) => c.en_menu).map((c) => c.nombre)).toEqual(["Mujer", "Hombre"]);
  });
});

describe("Productos: alta y validaciones", () => {
  let categoria;
  beforeEach(async () => {
    categoria = await nuevaCategoria("Galletitas");
  });

  it("crea el producto con sus presentaciones en un solo paso", async () => {
    const producto = await nuevoProducto(categoria.id);
    expect(producto).toMatchObject({ nombre: "Galletitas Oreo", slug: "galletitas-oreo", activo: true, publicado: true });
    expect(producto.categoria).toMatchObject({ id: categoria.id, nombre: "Galletitas" });
    expect(producto.variantes.map((v) => [v.nombre, v.precio, v.iva_porcentaje])).toEqual([
      ["118 g", "1000.00", "21.00"],
      ["Familiar 300 g", "2250.50", "10.50"],
    ]);
  });

  it("exige al menos una presentación y valida precios", async () => {
    const sinVariantes = await api.post("/api/catalogo/productos", { categoria_id: categoria.id, nombre: "X", variantes: [] });
    expect(sinVariantes.status).toBe(400);
    expect(sinVariantes.body.detalles[0].mensaje).toBe("Agregá al menos una presentación");

    const precios = await api.post("/api/catalogo/productos", {
      categoria_id: categoria.id,
      nombre: "X",
      variantes: [{ precio: 10.123 }, { nombre: "B", precio: 100, precio_anterior: 90 }, { nombre: "C", precio: -1 }],
    });
    expect(precios.status).toBe(400);
    expect(precios.body.detalles.map((d) => d.campo)).toEqual(["variantes.0.precio", "variantes.1.precio_anterior", "variantes.2.precio"]);
  });

  it("no permite códigos repetidos, ni en el mismo envío ni contra otro producto", async () => {
    const mismoEnvio = await api.post("/api/catalogo/productos", {
      categoria_id: categoria.id,
      nombre: "X",
      variantes: [{ nombre: "A", sku: "abc", precio: 1 }, { nombre: "B", sku: "ABC", precio: 1 }],
    });
    expect(mismoEnvio.status).toBe(400);
    expect(mismoEnvio.body.detalles[0]).toEqual({ campo: "variantes.1.sku", mensaje: "Código repetido en este producto" });

    await nuevoProducto(categoria.id);
    const otroProducto = await api.post("/api/catalogo/productos", {
      categoria_id: categoria.id,
      nombre: "Otra",
      variantes: [{ sku: "ore-118", precio: 1 }],
    });
    expect(otroProducto.status).toBe(409);
    expect(otroProducto.body.codigo).toBe("SKU_DUPLICADO");
  });

  it("rechaza nombre repetido en la categoría y categoría inexistente", async () => {
    await nuevoProducto(categoria.id);
    const repetido = await api.post("/api/catalogo/productos", { categoria_id: categoria.id, nombre: "galletitas oreo", variantes: [{ precio: 1 }] });
    expect(repetido.body.codigo).toBe("PRODUCTO_DUPLICADO");

    const sinCategoria = await api.post("/api/catalogo/productos", { categoria_id: 9999, nombre: "X", variantes: [{ precio: 1 }] });
    expect(sinCategoria.status).toBe(400);
    expect(sinCategoria.body.detalles[0].campo).toBe("categoria_id");
  });
});

describe("Productos: catálogo público y búsqueda", () => {
  let almacen, galletitas, bebidas;
  beforeEach(async () => {
    almacen = await nuevaCategoria("Almacén");
    galletitas = await nuevaCategoria("Galletitas", almacen.id);
    bebidas = await nuevaCategoria("Bebidas");
    await nuevoProducto(galletitas.id);
    await nuevoProducto(bebidas.id, { nombre: "Agua 100% mineral", marca: "Villavicencio", variantes: [{ sku: "AGU-1", precio: 500 }] });
    await nuevoProducto(bebidas.id, { nombre: "Gaseosa sin publicar", publicado: false, variantes: [{ sku: "GAS-1", precio: 800 }] });
    await nuevoProducto(bebidas.id, { nombre: "Jugo sin stock", variantes: [{ sku: "JUG-1", precio: 300, activo: false }] });
  });

  const nombres = (res) => res.body.data.map((p) => p.nombre);

  it("ofertas: solo productos con una presentación rebajada (precio anterior mayor al actual)", async () => {
    await nuevoProducto(bebidas.id, { nombre: "Soda en oferta", variantes: [{ sku: "SOD-1", precio: 400, precio_anterior: 500 }] });
    expect(nombres(await api.get("/api/catalogo/productos?oferta=1"))).toEqual(["Soda en oferta"]);
  });

  it("el público ve solo lo publicado y con presentaciones a la venta", async () => {
    const res = await api.get("/api/catalogo/productos");
    expect(res.status).toBe(200);
    expect(nombres(res)).toEqual(["Agua 100% mineral", "Galletitas Oreo"]);
    expect(res.body.paginacion).toMatchObject({ pagina: 1, total: 2 });
  });

  it("admin/staff ven todo y pueden filtrar por estado", async () => {
    expect(nombres(await api.get("/api/catalogo/productos", staff))).toHaveLength(4);
    expect(nombres(await api.get("/api/catalogo/productos?estado=sin_publicar", admin))).toEqual(["Gaseosa sin publicar"]);
  });

  it("filtrar por una categoría padre incluye sus subcategorías", async () => {
    expect(nombres(await api.get(`/api/catalogo/productos?categoria=${almacen.id}`))).toEqual(["Galletitas Oreo"]);
  });

  it("busca por nombre, marca o código, tratando % como texto", async () => {
    expect(nombres(await api.get("/api/catalogo/productos?q=oreo"))).toEqual(["Galletitas Oreo"]);
    expect(nombres(await api.get("/api/catalogo/productos?q=villa"))).toEqual(["Agua 100% mineral"]);
    expect(nombres(await api.get("/api/catalogo/productos?q=ore-300"))).toEqual(["Galletitas Oreo"]);
    expect(nombres(await api.get("/api/catalogo/productos?q=100%25"))).toEqual(["Agua 100% mineral"]);
    expect(nombres(await api.get("/api/catalogo/productos?q=%25"))).toEqual(["Agua 100% mineral"]);
  });

  it("pagina y ordena con valores permitidos", async () => {
    const res = await api.get("/api/catalogo/productos?limite=1&pagina=2&orden=-nombre");
    expect(nombres(res)).toEqual(["Agua 100% mineral"]);
    expect(res.body.paginacion).toEqual({ pagina: 2, limite: 1, total: 2, total_paginas: 2 });

    const invalido = await api.get("/api/catalogo/productos?orden=precio;DROP");
    expect(invalido.status).toBe(400);
  });

  it("el detalle público es por slug y oculta lo no publicado", async () => {
    const detalle = await api.get("/api/catalogo/productos/galletitas-oreo");
    expect(detalle.status).toBe(200);
    expect(detalle.body.data.variantes).toHaveLength(2);

    expect((await api.get("/api/catalogo/productos/gaseosa-sin-publicar")).status).toBe(404);
    expect((await api.get("/api/catalogo/productos/gaseosa-sin-publicar", staff)).status).toBe(200);
  });
});

describe("Productos: edición, estado y baja", () => {
  let categoria, producto;
  beforeEach(async () => {
    categoria = await nuevaCategoria("Galletitas");
    producto = await nuevoProducto(categoria.id);
  });

  it("sincroniza presentaciones: edita, agrega y da de baja", async () => {
    const [chica] = producto.variantes;
    const res = await api.put(`/api/catalogo/productos/${producto.id}`, {
      categoria_id: categoria.id,
      nombre: "Galletitas Oreo Original",
      variantes: [
        { id: chica.id, nombre: "118 g", sku: "ORE-118", precio: 1100 },
        { nombre: "Mini 50 g", sku: "ORE-300", precio: 400 }, // reutiliza el código de la que se da de baja
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("galletitas-oreo-original");
    expect(res.body.data.variantes.map((v) => [v.nombre, v.precio])).toEqual([
      ["118 g", "1100.00"],
      ["Mini 50 g", "400.00"],
    ]);
  });

  it("no acepta presentaciones de otro producto", async () => {
    const otro = await nuevoProducto(categoria.id, { nombre: "Otro", variantes: [{ sku: "OTRO-1", precio: 1 }] });
    const res = await api.put(`/api/catalogo/productos/${producto.id}`, {
      categoria_id: categoria.id,
      nombre: "Galletitas Oreo",
      variantes: [{ id: otro.variantes[0].id, precio: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it("despublicar lo saca de la tienda sin borrarlo", async () => {
    const res = await api.patch(`/api/catalogo/productos/${producto.id}/estado`, { publicado: false });
    expect(res.body.data.publicado).toBe(false);
    expect((await api.get("/api/catalogo/productos")).body.data).toHaveLength(0);
  });

  it("solo admin elimina; después ya no aparece y el nombre queda libre", async () => {
    expect((await api.delete(`/api/catalogo/productos/${producto.id}`, staff)).status).toBe(403);
    expect((await api.delete(`/api/catalogo/productos/${producto.id}`, admin)).status).toBe(204);
    expect((await api.get(`/api/catalogo/productos/${producto.id}`, admin)).status).toBe(404);
    expect((await api.post("/api/catalogo/productos", {
      categoria_id: categoria.id,
      nombre: "Galletitas Oreo",
      variantes: [{ sku: "ORE-118", precio: 1 }],
    })).status).toBe(201);
  });

  it("un token vencido no impide ver el catálogo público", async () => {
    const res = await request(app).get("/api/catalogo/productos").set("Authorization", "Bearer token-vencido");
    expect(res.status).toBe(200);
  });
});
