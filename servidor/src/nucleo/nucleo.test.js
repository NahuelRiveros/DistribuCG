import express from "express";
import request from "supertest";
import { z } from "compartido/zod.js";
import { describe, expect, it } from "vitest";
import { validar } from "./validar.js";
import { manejadorErrores } from "./manejador_errores.js";
import { Conflicto } from "./errores.js";
import { normalizarPaginacion, armarPaginacion } from "./paginacion.js";

function appDePrueba(configurar) {
  const app = express();
  app.use(express.json());
  configurar(app);
  app.use(manejadorErrores);
  return app;
}

describe("validar", () => {
  const app = appDePrueba((a) =>
    a.post(
      "/:id",
      validar({
        params: z.object({ id: z.coerce.number({ error: "Id inválido" }).int().positive("Id inválido") }),
        body: z.object({ nombre: z.string().trim().min(2, "El nombre es obligatorio") }),
      }),
      (req, res) => res.json({ ok: true, data: req.datos }),
    ),
  );

  it("entrega los datos limpios en req.datos", async () => {
    const res = await request(app).post("/7").send({ nombre: "  Yerba  ", extra: "ignorado" });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ params: { id: 7 }, body: { nombre: "Yerba" } });
  });

  it("junta todos los errores con el campo y un mensaje en español", async () => {
    const res = await request(app).post("/abc").send({ nombre: "" });
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe("DATOS_INVALIDOS");
    expect(res.body.detalles).toEqual([
      { campo: "id", mensaje: "Id inválido" },
      { campo: "nombre", mensaje: "El nombre es obligatorio" },
    ]);
  });
});

describe("manejadorErrores", () => {
  const app = appDePrueba((a) => {
    a.post("/json", (_req, res) => res.json({ ok: true }));
    a.get("/conflicto", async () => {
      throw new Conflicto("Ya existe un producto con ese nombre.", "PRODUCTO_DUPLICADO");
    });
    a.get("/inesperado", async () => {
      throw new Error("detalle interno que no debe salir");
    });
  });

  it("traduce ErrorApp lanzado desde una función async", async () => {
    const res = await request(app).get("/conflicto");
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ ok: false, codigo: "PRODUCTO_DUPLICADO", mensaje: "Ya existe un producto con ese nombre.", detalles: [] });
  });

  it("responde 400 ante un JSON mal formado", async () => {
    const res = await request(app).post("/json").set("Content-Type", "application/json").send("{mal");
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe("JSON_INVALIDO");
  });

  it("no filtra detalles internos en errores inesperados", async () => {
    const original = console.error;
    console.error = () => {};
    const res = await request(app).get("/inesperado");
    console.error = original;
    expect(res.status).toBe(500);
    expect(res.body.codigo).toBe("ERROR_INTERNO");
    expect(JSON.stringify(res.body)).not.toContain("detalle interno");
  });
});

describe("paginacion", () => {
  it("normaliza valores inválidos y limita el máximo", () => {
    expect(normalizarPaginacion({ pagina: "-3", limite: "5000" })).toEqual({ pagina: 1, limite: 100, offset: 0 });
    expect(normalizarPaginacion({ pagina: "3", limite: "10" })).toEqual({ pagina: 3, limite: 10, offset: 20 });
    expect(armarPaginacion({ pagina: 1, limite: 10, total: 25 })).toEqual({ pagina: 1, limite: 10, total: 25, total_paginas: 3 });
  });
});
