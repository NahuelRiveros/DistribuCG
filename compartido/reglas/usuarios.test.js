import { describe, expect, it } from "vitest";
import { problemaGestion, rolesQuePuedeAsignar, rolPrincipal } from "./usuarios.js";

const superAdmin = { id: 1, roles: ["super_admin"] };
const admin = { id: 2, roles: ["admin"] };
const staff = { id: 3, roles: ["staff"] };
const cliente = { id: 4, roles: ["cliente"] };
const otroAdmin = { id: 5, roles: ["admin"] };

describe("rolPrincipal", () => {
  it("elige el rol más alto", () => {
    expect(rolPrincipal(["cliente", "staff"])).toBe("staff");
    expect(rolPrincipal(["cliente"])).toBe("cliente");
    expect(rolPrincipal([])).toBeNull();
  });
});

describe("rolesQuePuedeAsignar", () => {
  it("el super admin da cualquier rol; el admin solo personal o cliente; el staff ninguno", () => {
    expect(rolesQuePuedeAsignar(superAdmin)).toEqual(["admin", "staff", "cliente"]);
    expect(rolesQuePuedeAsignar(admin)).toEqual(["staff", "cliente"]);
    expect(rolesQuePuedeAsignar(staff)).toEqual([]);
  });
});

describe("problemaGestion", () => {
  it("un admin gestiona personal y clientes", () => {
    expect(problemaGestion(admin, staff)).toBeNull();
    expect(problemaGestion(admin, cliente)).toBeNull();
  });

  it("solo el super admin gestiona a otros admin", () => {
    expect(problemaGestion(admin, otroAdmin)).toBe("Solo el super admin puede modificar a otro administrador.");
    expect(problemaGestion(superAdmin, otroAdmin)).toBeNull();
  });

  it("nadie se modifica a sí mismo ni toca al super admin", () => {
    expect(problemaGestion(admin, admin)).toBe("Tu propio usuario no se modifica desde acá.");
    expect(problemaGestion(superAdmin, { id: 9, roles: ["super_admin"] })).toBe("El super admin no se puede modificar desde el panel.");
    expect(problemaGestion(admin, superAdmin)).toBe("El super admin no se puede modificar desde el panel.");
  });

  it("el staff no gestiona a nadie", () => {
    expect(problemaGestion(staff, cliente)).not.toBeNull();
  });
});
