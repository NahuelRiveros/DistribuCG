import express from "express";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { manejadorErrores } from "../../nucleo/manejador_errores.js";
import { requerirAuth, requerirModulo, requerirRol } from "../../nucleo/auth/middlewares.js";
import { crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";

const app = crearApp();
const CLAVE = "clave-segura-123";

async function loguear(email, contrasena = CLAVE) {
  return request(app).post("/api/auth/login").send({ email, contrasena });
}

beforeAll(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  await crearUsuario({ email: "admin@test.com", roles: ["admin"] });
  await crearUsuario({ email: "cliente@test.com", roles: ["cliente"] });
  await crearUsuario({ email: "suspendido@test.com", activo: false });
});
afterAll(() => sequelize.close());

describe("POST /api/auth/login", () => {
  it("devuelve token y usuario con roles, sin la contraseña", async () => {
    const res = await loguear("admin@test.com");
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.usuario).toMatchObject({ email: "admin@test.com", roles: ["admin"] });
    expect(JSON.stringify(res.body)).not.toContain("contrasena");
  });

  it("acepta el email con mayúsculas y espacios", async () => {
    const res = await loguear("  ADMIN@test.com ");
    expect(res.status).toBe(200);
  });

  it("da el mismo error si la contraseña es incorrecta o el email no existe", async () => {
    const malaClave = await loguear("admin@test.com", "otra-clave");
    const noExiste = await loguear("nadie@test.com");
    for (const res of [malaClave, noExiste]) {
      expect(res.status).toBe(401);
      expect(res.body.codigo).toBe("CREDENCIALES_INCORRECTAS");
    }
  });

  it("rechaza datos inválidos con el detalle del campo", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "no-es-email" });
    expect(res.status).toBe(400);
    expect(res.body.detalles.map((d) => d.campo)).toEqual(["email", "contrasena"]);
  });

  it("no deja entrar a una cuenta suspendida", async () => {
    const res = await loguear("suspendido@test.com");
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe("CUENTA_SUSPENDIDA");
  });
});

describe("GET /api/auth/yo", () => {
  it("pide sesión", async () => {
    const res = await request(app).get("/api/auth/yo");
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe("NO_AUTORIZADO");
  });

  it("devuelve el perfil con un token válido", async () => {
    const { body } = await loguear("cliente@test.com");
    const res = await request(app).get("/api/auth/yo").set("Authorization", `Bearer ${body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: "cliente@test.com", roles: ["cliente"] });
  });

  it("rechaza un token inventado", async () => {
    const res = await request(app).get("/api/auth/yo").set("Authorization", "Bearer abc.def.ghi");
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe("SESION_VENCIDA");
  });

  it("invalida los tokens viejos cuando cambia la contraseña", async () => {
    const usuario = await crearUsuario({ email: "cambia@test.com" });
    const { body } = await loguear("cambia@test.com");
    await usuario.update({ contrasena: await bcrypt.hash("nueva-clave-456", 4) });

    const res = await request(app).get("/api/auth/yo").set("Authorization", `Bearer ${body.data.token}`);
    expect(res.status).toBe(401);
  });
});

describe("middlewares de permisos", () => {
  const appPermisos = express();
  appPermisos.get("/admin", requerirAuth, requerirRol("admin"), (_req, res) => res.json({ ok: true }));
  appPermisos.get("/apagado", requerirModulo("modulo_que_no_existe"), (_req, res) => res.json({ ok: true }));
  appPermisos.use(manejadorErrores);

  it("requerirRol deja pasar al rol correcto y bloquea al resto con 403", async () => {
    const admin = (await loguear("admin@test.com")).body.data.token;
    const cliente = (await loguear("cliente@test.com")).body.data.token;

    expect((await request(appPermisos).get("/admin").set("Authorization", `Bearer ${admin}`)).status).toBe(200);
    const res = await request(appPermisos).get("/admin").set("Authorization", `Bearer ${cliente}`);
    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe("SIN_PERMISO");
  });

  it("requerirModulo responde 404 si el módulo está apagado", async () => {
    const res = await request(appPermisos).get("/apagado");
    expect(res.status).toBe(404);
  });
});
