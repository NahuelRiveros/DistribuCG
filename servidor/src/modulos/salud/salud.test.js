import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { limpiarValor } from "../../nucleo/env.js";

const app = crearApp();
afterAll(() => sequelize.close());

describe("GET /api/salud", () => {
  it("por defecto no toca la base (Render la consulta seguido y Neon tiene que poder suspenderse)", async () => {
    const res = await request(app).get("/api/salud");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ estado: "ok", base_de_datos: "sin_revisar" });
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("con ?bd=1 confirma que la base responde", async () => {
    const res = await request(app).get("/api/salud?bd=1");
    expect(res.body.data).toMatchObject({ estado: "ok", base_de_datos: "ok" });
  });

  it("el catálogo público se puede reutilizar unos segundos; con sesión, no se comparte", async () => {
    const publico = await request(app).get("/api/catalogo/categorias");
    expect(publico.headers["cache-control"]).toBe("public, max-age=30, stale-while-revalidate=120");
    expect(publico.headers.vary).toMatch(/Authorization/);
    const conSesion = await request(app).get("/api/catalogo/categorias").set("Authorization", "Bearer x");
    expect(conSesion.headers["cache-control"]).toBe("private, no-cache");
  });

  it("CORS: la tienda permitida recibe el permiso; otra web, no", async () => {
    // En tests (sin URL_FRONTEND_VERCEL) se permite la tienda local de Vite.
    const tienda = await request(app).get("/api/salud").set("Origin", "http://localhost:5173");
    expect(tienda.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const otra = await request(app).get("/api/salud").set("Origin", "https://otra-web.com");
    expect(otra.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("los valores cargados con comillas o espacios (ej. en el panel de Render) se limpian", () => {
    expect(limpiarValor(' "https://mi-tienda.vercel.app" ')).toBe("https://mi-tienda.vercel.app");
    expect(limpiarValor("'abc'")).toBe("abc");
    expect(limpiarValor("sin-comillas")).toBe("sin-comillas");
    expect(limpiarValor('"solo-una')).toBe('"solo-una');
  });

  it("responde 404 en JSON para rutas que no existen", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe("RUTA_NO_ENCONTRADA");
  });
});
