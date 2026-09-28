import { describe, expect, it } from "vitest";
import { formatearDinero } from "./formatear_dinero.js";
import { esExternoSeguro, esInterno } from "./enlaces.js";
import { volverASeguro } from "@/componentes/acceso/volver_a.js";

describe("formatearDinero", () => {
  it("formatea en pesos argentinos lo que devuelve el API", () => {
    expect(formatearDinero("1234.5").replace(/\s/g, " ")).toBe("$ 1.234,50");
    expect(formatearDinero("no-es-numero")).toBe("—");
  });
});

describe("enlaces", () => {
  it("distingue rutas internas de externas y rechaza protocolos peligrosos", () => {
    expect(esInterno("/#contacto")).toBe(true);
    expect(esInterno("//otro-sitio.com")).toBe(false);
    expect(esExternoSeguro("https://wa.me/549")).toBe(true);
    expect(esExternoSeguro("mailto:a@b.com")).toBe(true);
    expect(esExternoSeguro("javascript:alert(1)")).toBe(false);
  });
});

describe("volverASeguro", () => {
  it("solo permite volver a rutas internas", () => {
    expect(volverASeguro("/mis-pedidos?p=2")).toBe("/mis-pedidos?p=2");
    expect(volverASeguro("https://malicioso.com")).toBe("/");
    expect(volverASeguro("//malicioso.com")).toBe("/");
    expect(volverASeguro("/login")).toBe("/");
  });
});
