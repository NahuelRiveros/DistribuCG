import { describe, expect, it } from "vitest";
import { columnaPrimerDia, diasDelMes, esFechaValida, fechaLarga, hoyEn } from "./fechas.js";

describe("hoyEn", () => {
  it("usa la zona del negocio: 01:30 UTC todavía es el día anterior en Argentina", () => {
    const ahora = new Date("2026-09-29T01:30:00Z");
    expect(hoyEn("America/Argentina/Buenos_Aires", ahora)).toBe("2026-09-28");
    expect(hoyEn("UTC", ahora)).toBe("2026-09-29");
  });
});

describe("esFechaValida", () => {
  it("acepta fechas reales y rechaza las que no existen o tienen otro formato", () => {
    expect(esFechaValida("2028-02-29")).toBe(true);
    expect(esFechaValida("2026-02-29")).toBe(false);
    expect(esFechaValida("2026-9-1")).toBe(false);
    expect(esFechaValida("")).toBe(false);
  });
});

describe("calendario", () => {
  it("sabe cuántos días tiene cada mes y en qué columna empieza (lunes = 0)", () => {
    expect(diasDelMes(2026, 2)).toBe(28);
    expect(diasDelMes(2028, 2)).toBe(29);
    expect(diasDelMes(2026, 9)).toBe(30);
    expect(columnaPrimerDia(2026, 9)).toBe(1); // 1/9/2026 es martes
    expect(columnaPrimerDia(2026, 6)).toBe(0); // 1/6/2026 es lunes
  });

  it("arma la fecha larga en español", () => {
    expect(fechaLarga("2026-09-28")).toBe("Lunes 28 de septiembre");
  });
});
