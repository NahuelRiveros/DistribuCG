import { describe, expect, it } from "vitest";
import { aliasValido, cbuValido, cuitValido } from "./bancarios.js";

describe("cbuValido", () => {
  it("acepta CBU con los dos dígitos verificadores correctos (con o sin espacios)", () => {
    expect(cbuValido("2850590940090418135201")).toBe(true);
    expect(cbuValido("0110599520000001235579")).toBe(true);
    expect(cbuValido("2850 5909 4009 0418 1352 01")).toBe(true);
  });

  it("rechaza un dígito mal tipeado, un largo incorrecto o letras", () => {
    expect(cbuValido("2850590940090418135202")).toBe(false); // último dígito
    expect(cbuValido("2850590840090418135201")).toBe(false); // primer bloque
    expect(cbuValido("285059094009041813520")).toBe(false);
    expect(cbuValido("28505909400904181352AB")).toBe(false);
  });
});

describe("aliasValido", () => {
  it("de 6 a 20 caracteres con letras, números, puntos y guiones", () => {
    expect(aliasValido("MI.TIENDA.PAGOS")).toBe(true);
    expect(aliasValido("corto")).toBe(false);
    expect(aliasValido("con espacios no")).toBe(false);
    expect(aliasValido("a".repeat(21))).toBe(false);
  });
});

describe("cuitValido", () => {
  it("valida el dígito verificador y acepta guiones", () => {
    expect(cuitValido("30-50001091-2")).toBe(true);
    expect(cuitValido("20-12345678-6")).toBe(true);
    expect(cuitValido("20-12345678-0")).toBe(false);
    expect(cuitValido("30-00000000-0")).toBe(false);
  });
});
