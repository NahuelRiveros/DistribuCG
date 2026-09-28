import { describe, expect, it } from "vitest";
import { totalesLinea, totalesPedido } from "./pedido_totales.js";

describe("totales de pedido", () => {
  it("calcula la línea con IVA redondeando por unidad", () => {
    expect(totalesLinea({ precio: "999.99", iva_porcentaje: "10.50", cantidad: 3 })).toEqual({
      precio_final_unitario: 1104.99,
      subtotal_neto: 2999.97,
      iva: 315,
      subtotal_final: 3314.97,
    });
  });

  it("suma el pedido sin errores de coma flotante", () => {
    const lineas = [
      { precio: "0.10", iva_porcentaje: 21, cantidad: 3 },
      { precio: "1000", iva_porcentaje: 21, cantidad: 1 },
    ];
    expect(totalesPedido(lineas)).toEqual({ subtotal_neto: 1000.3, iva: 210.06, total: 1210.36 });
  });
});
