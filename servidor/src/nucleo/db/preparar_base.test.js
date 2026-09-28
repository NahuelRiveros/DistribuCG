import { afterAll, describe, expect, it } from "vitest";
import { sequelize } from "./sequelize.js";
import { prepararBase } from "./preparar_base.js";
import { Rol, ROLES } from "../../modulos/usuarios/modelos.js";

afterAll(() => sequelize.close());

describe("prepararBase (arranque del servidor)", () => {
  it("es idempotente: sin migraciones pendientes no aplica nada y deja los roles cargados", async () => {
    const mensajes = [];
    const log = (m) => mensajes.push(m);
    // Dos arranques simultáneos (ej. dos instancias): el candado los ordena y ninguno falla.
    const [a, b] = await Promise.all([prepararBase({ log }), prepararBase({ log })]);
    expect([...a, ...b]).toEqual([]);
    expect(await Rol.count()).toBe(ROLES.length);
  });
});
