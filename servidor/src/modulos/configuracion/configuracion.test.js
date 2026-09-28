import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { proyecto } from "compartido/proyecto.js";
import { crearApp } from "../../app.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { autorizacion, crearRoles, crearUsuario, vaciarTablas } from "../../../tests/ayudantes.js";
import { olvidarConfiguracion } from "./configuracion_servicio.js";

const app = crearApp();
let admin, otroAdmin, staff;

beforeEach(async () => {
  await vaciarTablas("configuracion_cambio", "configuracion", "usuario_rol", "usuario", "rol");
  olvidarConfiguracion();
  await crearRoles();
  admin = await crearUsuario({ email: "admin@test.com", roles: ["admin"] });
  otroAdmin = await crearUsuario({ email: "admin2@test.com", roles: ["admin"] });
  staff = await crearUsuario({ email: "staff@test.com", roles: ["staff"] });
});
afterAll(() => sequelize.close());

const pagos = () => structuredClone(proyecto.pagos);
const guardarComo = (usuario, valor, version = null) => request(app).put("/api/configuracion/pagos").set(...autorizacion(usuario)).send({ valor, version });

describe("GET /api/configuracion/pagos", () => {
  it("es público y, si nunca se guardó, devuelve los valores iniciales del proyecto", async () => {
    const res = await request(app).get("/api/configuracion/pagos");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(pagos());
  });
});

describe("PUT /api/configuracion/pagos", () => {
  it("solo admin: sin sesión 401, personal 403 (y tampoco puede ver el editor)", async () => {
    expect((await request(app).put("/api/configuracion/pagos").send({ valor: pagos(), version: null })).status).toBe(401);
    expect((await guardarComo(staff, pagos())).status).toBe(403);
    expect((await request(app).get("/api/configuracion/pagos/editar").set(...autorizacion(staff))).status).toBe(403);
  });

  it("guarda, la tienda lo ve enseguida y queda registrado quién lo cambió", async () => {
    const nuevo = pagos();
    nuevo.cinta = "¡Envío gratis esta semana!";
    nuevo.promociones = [];
    const res = await guardarComo(admin, nuevo);
    expect(res.status).toBe(200);
    expect(res.body.data.version).toEqual(expect.any(String));
    expect(res.body.data.historial).toEqual([expect.objectContaining({ usuario: expect.objectContaining({ id: admin.id }) })]);

    const publico = await request(app).get("/api/configuracion/pagos");
    expect(publico.body.data).toMatchObject({ cinta: "¡Envío gratis esta semana!", promociones: [] });
  });

  it("valida con el schema compartido: CBU con dígitos de control y CFT si hay interés", async () => {
    const malo = pagos();
    malo.datos_transferencia.cbu = "2850590940090418135202";
    malo.financiacion[0].planes.push({ cuotas: 12, interes: 30 });
    const res = await guardarComo(admin, malo);
    expect(res.status).toBe(400);
    expect(res.body.detalles.map((d) => d.campo)).toEqual(expect.arrayContaining(["valor.datos_transferencia.cbu", `valor.financiacion.0.planes.${malo.financiacion[0].planes.length - 1}.cft`]));
  });

  it("si otra persona guardó mientras tanto, avisa en vez de pisar sus cambios", async () => {
    const vista = (await request(app).get("/api/configuracion/pagos/editar").set(...autorizacion(admin))).body.data.version; // null
    const cambioAjeno = pagos();
    cambioAjeno.cinta = "Cambio de la otra persona";
    expect((await guardarComo(otroAdmin, cambioAjeno, vista)).status).toBe(200);

    const res = await guardarComo(admin, pagos(), vista);
    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe("CONFIGURACION_CAMBIO");
    expect((await request(app).get("/api/configuracion/pagos")).body.data.cinta).toBe("Cambio de la otra persona");
  });
});
