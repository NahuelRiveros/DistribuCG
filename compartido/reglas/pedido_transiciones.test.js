import { describe, expect, it } from "vitest";
import { problemaTransicion } from "./pedido_transiciones.js";

describe("problemaTransicion", () => {
  it("permite el recorrido normal sin motivo", () => {
    expect(problemaTransicion({ desde: "pendiente", hacia: "en_preparacion" })).toBeNull();
    expect(problemaTransicion({ desde: "en_preparacion", hacia: "entregado" })).toBeNull();
  });

  it("rechaza saltos no permitidos", () => {
    expect(problemaTransicion({ desde: "pendiente", hacia: "entregado" })).toBe("Ese cambio de estado no está permitido.");
  });

  it("exige motivo al cancelar o retroceder", () => {
    expect(problemaTransicion({ desde: "pendiente", hacia: "cancelado" })).toBe("Indicá el motivo del cambio.");
    expect(problemaTransicion({ desde: "pendiente", hacia: "cancelado", motivo: "Cliente desistió" })).toBeNull();
  });

  it("puede exigir cobro previo según la configuración", () => {
    const reglas = {
      transiciones: { en_preparacion: ["entregado"] },
      estados_requieren_cobro: ["entregado"],
      motivo_requerido: [],
    };
    expect(problemaTransicion({ desde: "en_preparacion", hacia: "entregado", estadoCobro: "pendiente" }, reglas))
      .toBe("Registrá un cobro antes de avanzar a este estado.");
    expect(problemaTransicion({ desde: "en_preparacion", hacia: "entregado", estadoCobro: "pagado" }, reglas)).toBeNull();
  });
});
