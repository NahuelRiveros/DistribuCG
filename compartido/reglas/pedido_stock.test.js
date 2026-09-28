import { describe, expect, it } from "vitest";
import { proyecto } from "../proyecto.js";
import { faseStock, movimientosEntreFases } from "./pedido_stock.js";

describe("stock de los pedidos", () => {
  it("con 'confirmacion': reserva al recibir y descuenta al preparar", () => {
    expect(["pendiente", "en_preparacion", "entregado", "cancelado"].map((e) => faseStock(e, "confirmacion"))).toEqual([
      "reservado",
      "descontado",
      "descontado",
      "ninguna",
    ]);
  });

  it("todos los estados configurados tienen regla para todos los modos", () => {
    for (const modo of ["envio_pedido", "confirmacion", "entrega"]) {
      for (const estado of Object.keys(proyecto.pedidos.estados)) expect(() => faseStock(estado, modo)).not.toThrow();
    }
  });

  it("cada cambio de fase genera los movimientos justos", () => {
    expect(movimientosEntreFases("reservado", "descontado", 3)).toEqual([{ tipo: "venta", cantidad: -3, reservado: -3 }]);
    expect(movimientosEntreFases("descontado", "ninguna", 3)).toEqual([{ tipo: "devolucion", cantidad: 3, reservado: 0 }]);
    expect(movimientosEntreFases("descontado", "reservado", 2).map((m) => m.tipo)).toEqual(["devolucion", "reserva"]);
    expect(movimientosEntreFases("descontado", "descontado", 3)).toEqual([]);
  });
});
