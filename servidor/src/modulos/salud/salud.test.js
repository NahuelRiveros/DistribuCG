import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";

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

  it("responde 404 en JSON para rutas que no existen", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe("RUTA_NO_ENCONTRADA");
  });
});
