import { describe, expect, it } from "vitest";
import { aCentavos, desdeCentavos, precioConIva, subtotalLinea, sumarCentavos } from "./dinero.js";

describe("dinero", () => {
  it("convierte importes de la base (texto) a centavos sin errores de coma flotante", () => {
    expect(aCentavos("10.05")).toBe(1005);
    expect(aCentavos(0.1 + 0.2)).toBe(30);
    expect(aCentavos("1234.50")).toBe(123450);
  });

  it("rechaza importes que no son números", () => {
    expect(() => aCentavos("abc")).toThrow("Importe inválido");
  });

  it("calcula IVA general y reducido redondeando al centavo", () => {
    expect(precioConIva(10000, 21)).toBe(12100);
    expect(precioConIva(999, 10.5)).toBe(1104);
    expect(precioConIva(10000, 0)).toBe(10000);
  });

  it("suma líneas y vuelve a pesos", () => {
    const total = sumarCentavos([subtotalLinea(1005, 3), subtotalLinea(250, 2)]);
    expect(total).toBe(3515);
    expect(desdeCentavos(total)).toBe(35.15);
  });
});
