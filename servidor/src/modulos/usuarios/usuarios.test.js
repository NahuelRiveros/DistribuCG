import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";

const app = crearApp();
const CLAVE = "clave-segura-123";
const NUEVA = { nombre: "Juan", apellido: "Pérez", email: "juan@test.com", contrasena: CLAVE, rol: "staff" };

let superAdmin, admin, otroAdmin, staff, cliente;

beforeEach(async () => {
  await vaciarTablas("usuario_rol", "usuario", "rol");
  await crearRoles();
  superAdmin = await crearUsuario({ email: "super@test.com", roles: ["super_admin"] });
  admin = await crearUsuario({ email: "admin@test.com", roles: ["admin"] });
  otroAdmin = await crearUsuario({ email: "admin2@test.com", roles: ["admin"] });
  staff = await crearUsuario({ email: "staff@test.com", roles: ["staff"] });
  cliente = await crearUsuario({ email: "cliente@test.com", roles: ["cliente"] });
});
afterAll(() => sequelize.close());

const como = (usuario) => ({
  get: (url) => request(app).get(url).set(...autorizacion(usuario)),
  post: (url, body) => request(app).post(url).set(...autorizacion(usuario)).send(body),
  patch: (url, body) => request(app).patch(url).set(...autorizacion(usuario)).send(body),
  put: (url, body) => request(app).put(url).set(...autorizacion(usuario)).send(body),
});
const login = (email, contrasena = CLAVE) => request(app).post("/api/auth/login").send({ email, contrasena });

describe("acceso a /api/usuarios", () => {
  it("sin sesión responde 401 y el personal (staff) o un cliente no entran", async () => {
    expect((await request(app).get("/api/usuarios")).status).toBe(401);
    expect((await como(staff).get("/api/usuarios")).status).toBe(403);
    expect((await como(cliente).get("/api/usuarios")).status).toBe(403);
  });
});

describe("GET /api/usuarios", () => {
  it("por defecto lista solo los usuarios del panel, sin contraseñas, y marca a quién puede modificar", async () => {
    const res = await como(admin).get("/api/usuarios");
    expect(res.status).toBe(200);
    expect(res.body.data.map((u) => u.email).sort()).toEqual(["admin2@test.com", "admin@test.com", "staff@test.com", "super@test.com"]);
    expect(JSON.stringify(res.body)).not.toContain("contrasena");

    const porEmail = Object.fromEntries(res.body.data.map((u) => [u.email, u]));
    expect(porEmail["staff@test.com"]).toMatchObject({ rol: "staff", gestionable: true });
    expect(porEmail["admin2@test.com"]).toMatchObject({ gestionable: false, motivo_no_gestionable: "Solo el super admin puede modificar a otro administrador." });
    expect(porEmail["admin@test.com"].gestionable).toBe(false); // él mismo
    expect(porEmail["super@test.com"].gestionable).toBe(false);
  });

  it("filtra por rol, estado y texto", async () => {
    await como(superAdmin).patch(`/api/usuarios/${staff.id}/estado`, { activo: false });

    const clientes = await como(admin).get("/api/usuarios?rol=cliente");
    expect(clientes.body.data.map((u) => u.email)).toEqual(["cliente@test.com"]);

    const inactivos = await como(admin).get("/api/usuarios?estado=inactivos");
    expect(inactivos.body.data.map((u) => u.email)).toEqual(["staff@test.com"]);

    const buscados = await como(admin).get("/api/usuarios?q=admin2");
    expect(buscados.body.data.map((u) => u.email)).toEqual(["admin2@test.com"]);
    expect(buscados.body.paginacion).toMatchObject({ pagina: 1, total: 1 });
  });

  it("rechaza un filtro de rol que no existe", async () => {
    const res = await como(admin).get("/api/usuarios?rol=super_admin");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/usuarios", () => {
  it("un admin crea personal que puede ingresar con su contraseña", async () => {
    const res = await como(admin).post("/api/usuarios", NUEVA);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: "juan@test.com", rol: "staff", roles: ["staff"], activo: true, gestionable: true });

    const ingreso = await login("juan@test.com");
    expect(ingreso.status).toBe(200);
    expect(ingreso.body.data.usuario.roles).toEqual(["staff"]);
  });

  it("solo el super admin crea administradores", async () => {
    const delAdmin = await como(admin).post("/api/usuarios", { ...NUEVA, rol: "admin" });
    expect(delAdmin.status).toBe(403);
    expect(delAdmin.body.codigo).toBe("ROL_NO_PERMITIDO");

    const delSuper = await como(superAdmin).post("/api/usuarios", { ...NUEVA, rol: "admin" });
    expect(delSuper.status).toBe(201);
    expect(delSuper.body.data.rol).toBe("admin");
  });

  it("no deja repetir un email y valida los datos", async () => {
    const repetido = await como(admin).post("/api/usuarios", { ...NUEVA, email: "CLIENTE@test.com" });
    expect(repetido.status).toBe(409);
    expect(repetido.body.codigo).toBe("EMAIL_REGISTRADO");

    const invalido = await como(admin).post("/api/usuarios", { ...NUEVA, contrasena: "corta", rol: "super_admin" });
    expect(invalido.status).toBe(400);
    expect(invalido.body.detalles.map((d) => d.campo).sort()).toEqual(["contrasena", "rol"]);
  });
});

describe("PATCH /api/usuarios/:id", () => {
  it("un admin le da acceso al panel a un cliente cambiándole el rol", async () => {
    const res = await como(admin).patch(`/api/usuarios/${cliente.id}`, { nombre: "Ana", apellido: "", email: "cliente@test.com", rol: "staff" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ nombre: "Ana", apellido: null, roles: ["staff"] });

    // Rige enseguida: con la misma sesión ya ve el panel (los roles se leen en cada pedido)
    expect((await como(cliente).get("/api/pedidos")).status).not.toBe(403);
  });

  it("no deja modificar a otro admin, al super admin ni a uno mismo", async () => {
    const datos = { nombre: "Xavier", email: "x@test.com", rol: "staff" };
    for (const [actor, objetivo, mensaje] of [
      [admin, otroAdmin, "Solo el super admin puede modificar a otro administrador."],
      [admin, superAdmin, "El super admin no se puede modificar desde el panel."],
      [superAdmin, superAdmin, "Tu propio usuario no se modifica desde acá."],
      [admin, admin, "Tu propio usuario no se modifica desde acá."],
    ]) {
      const res = await como(actor).patch(`/api/usuarios/${objetivo.id}`, datos);
      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ codigo: "USUARIO_NO_GESTIONABLE", mensaje });
    }
  });

  it("no deja usar el email de otro usuario y avisa si el usuario no existe", async () => {
    const repetido = await como(admin).patch(`/api/usuarios/${staff.id}`, { nombre: "Staff", email: "cliente@test.com", rol: "staff" });
    expect(repetido.status).toBe(409);

    const noExiste = await como(admin).patch("/api/usuarios/9999", { nombre: "Staff", email: "nuevo@test.com", rol: "staff" });
    expect(noExiste.status).toBe(404);
  });
});

describe("PATCH /api/usuarios/:id/estado", () => {
  it("al desactivar, el usuario pierde la sesión y no puede volver a ingresar hasta que lo reactiven", async () => {
    const res = await como(admin).patch(`/api/usuarios/${staff.id}/estado`, { activo: false });
    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);

    expect((await como(staff).get("/api/auth/yo")).body.codigo).toBe("SESION_VENCIDA");
    expect((await login("staff@test.com")).body.codigo).toBe("CUENTA_SUSPENDIDA");

    await como(admin).patch(`/api/usuarios/${staff.id}/estado`, { activo: true });
    expect((await login("staff@test.com")).status).toBe(200);
  });

  it("nadie se desactiva a sí mismo", async () => {
    const res = await como(admin).patch(`/api/usuarios/${admin.id}/estado`, { activo: false });
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/usuarios/:id/contrasena", () => {
  it("cambia la contraseña y cierra las sesiones abiertas de ese usuario", async () => {
    const res = await como(admin).put(`/api/usuarios/${staff.id}/contrasena`, { contrasena: "otra-clave-456", confirmar: "otra-clave-456" });
    expect(res.status).toBe(200);

    expect((await como(staff).get("/api/auth/yo")).status).toBe(401);
    expect((await login("staff@test.com")).status).toBe(401);
    expect((await login("staff@test.com", "otra-clave-456")).status).toBe(200);
  });

  it("exige que las dos contraseñas coincidan", async () => {
    const res = await como(admin).put(`/api/usuarios/${staff.id}/contrasena`, { contrasena: "otra-clave-456", confirmar: "otra-clave-789" });
    expect(res.status).toBe(400);
    expect(res.body.detalles).toEqual([{ campo: "confirmar", mensaje: "Las contraseñas no coinciden" }]);
  });
});
