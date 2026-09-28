import { describe, expect, it } from "vitest";
import { slugDisponible, slugificar } from "./slug.js";

describe("slugificar", () => {
  it("quita acentos, ñ, mayúsculas y símbolos", () => {
    expect(slugificar("Galletitas Dulces Ñandú  118g!")).toBe("galletitas-dulces-nandu-118g");
    expect(slugificar("  Almacén > Aceites ")).toBe("almacen-aceites");
  });

  it("nunca devuelve vacío", () => {
    expect(slugificar("¡¿?!")).toBe("item");
  });
});

describe("slugDisponible", () => {
  it("numera cuando el slug ya existe", () => {
    expect(slugDisponible("yerba", [])).toBe("yerba");
    expect(slugDisponible("yerba", ["yerba", "yerba-2"])).toBe("yerba-3");
  });
});
