import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";

const app = crearApp();
afterAll(() => sequelize.close());

describe("GET /api/salud", () => {
  it("confirma que la API y la base responden", async () => {
    const res = await request(app).get("/api/salud");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ estado: "ok", base_de_datos: "ok" });
  });

  it("responde 404 en JSON para rutas que no existen", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe("RUTA_NO_ENCONTRADA");
  });
});
