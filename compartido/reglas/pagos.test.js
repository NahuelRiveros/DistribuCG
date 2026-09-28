import { describe, expect, it } from "vitest";
import { cintaDestacada, conDescuento, cuotasDe, financiacionActiva, mediosTienda, mejorCuotaSinInteres, mejorDescuento, promocionesVigentes, totalConMedio } from "./pagos.js";

// Config fija (no la del proyecto): cargar los datos reales no rompe estos tests.
const PAGOS = {
  medios: [
    { valor: "transferencia", etiqueta: "Transferencia bancaria", en_tienda: true, descuento: 10 },
    { valor: "efectivo", etiqueta: "Efectivo", en_tienda: true, descuento: 0 },
    { valor: "otro", etiqueta: "Otro medio", en_tienda: false, descuento: 50 },
  ],
  financiacion: [
    { nombre: "Mercado Pago", planes: [{ cuotas: 3, interes: 0 }, { cuotas: 6, interes: 0 }, { cuotas: 12, interes: 35 }] },
    { nombre: "Tarjetas", planes: [{ cuotas: 9, interes: 20 }] },
  ],
  promociones: [{ banco: "Banco Uno", detalle: "20% de reintegro", dias: ["jueves"], hasta: "2026-12-31" }],
  cinta: null,
};

describe("descuento por medio de pago", () => {
  it("redondea una sola vez en centavos", () => {
    expect(conDescuento(3630, 10)).toEqual({ descuento: 363, total: 3267 });
    expect(conDescuento(0.15, 10)).toEqual({ descuento: 0.02, total: 0.13 });
  });

  it("aplica el % del medio elegido y 0 si el medio no tiene descuento", () => {
    expect(totalConMedio(1000, "transferencia", PAGOS)).toEqual({ descuento: 100, total: 900, porcentaje: 10 });
    expect(totalConMedio(1000, "efectivo", PAGOS)).toEqual({ descuento: 0, total: 1000, porcentaje: 0 });
    expect(totalConMedio(1000, "no-existe", PAGOS)).toEqual({ descuento: 0, total: 1000, porcentaje: 0 });
  });

  it("en la tienda solo se ofrecen los medios habilitados, y el mejor descuento es transferencia", () => {
    // "otro" tiene 50 % pero no se ofrece en la tienda: no cuenta como mejor descuento
    expect(mediosTienda(PAGOS).map((m) => m.valor)).toEqual(["transferencia", "efectivo"]);
    expect(mejorDescuento(PAGOS)).toMatchObject({ valor: "transferencia", descuento: 10 });
  });
});

describe("cuotas", () => {
  it("sin interés divide el precio; con interés suma el recargo", () => {
    expect(cuotasDe(1000, { cuotas: 3, interes: 0 })).toEqual({ cuotas: 3, valor_cuota: 333.33, total: 1000, sin_interes: true });
    expect(cuotasDe(1000, { cuotas: 12, interes: 35 })).toEqual({ cuotas: 12, valor_cuota: 112.5, total: 1350, sin_interes: false });
  });

  it("la mejor cuota sin interés es la de más cuotas sin recargo", () => {
    expect(mejorCuotaSinInteres(6000, PAGOS)).toEqual({ cuotas: 6, valor_cuota: 1000, total: 6000, sin_interes: true, opcion: "Mercado Pago" });
  });
});

describe("pausar sin borrar", () => {
  it("un plan o una promoción con activo: false no se ofrece", () => {
    const pagos = {
      ...PAGOS,
      financiacion: [{ nombre: "Mercado Pago", planes: [{ cuotas: 3, interes: 0 }, { cuotas: 6, interes: 0, activo: false }] }, { nombre: "Pausada", planes: [{ cuotas: 12, interes: 0, activo: false }] }],
      promociones: [{ ...PAGOS.promociones[0], activo: false }],
    };
    expect(mejorCuotaSinInteres(900, pagos)).toMatchObject({ cuotas: 3 });
    expect(financiacionActiva(pagos).map((o) => o.nombre)).toEqual(["Mercado Pago"]);
    expect(promocionesVigentes("2026-10-01", pagos)).toEqual([]);
  });
});

describe("promociones", () => {
  it("descarta las vencidas y marca si aplican hoy según el día", () => {
    expect(promocionesVigentes("2027-01-01", PAGOS)).toEqual([]);
    const [jueves] = promocionesVigentes("2026-10-01", PAGOS); // 1/10/2026 es jueves
    expect(jueves).toMatchObject({ banco: "Banco Uno", hoy: true });
    expect(promocionesVigentes("2026-10-02", PAGOS)[0].hoy).toBe(false);
  });
});

describe("cinta destacada", () => {
  it("se arma sola con la mejor cuota sin interés y el mejor descuento", () => {
    expect(cintaDestacada(PAGOS)).toBe("¡Llevátelo en hasta 6 cuotas sin interés o con 10% OFF pagando con transferencia bancaria!");
  });

  it("usa la cinta configurada si hay, y no inventa nada si no hay cuotas ni descuentos", () => {
    expect(cintaDestacada({ ...PAGOS, cinta: "Envío gratis" })).toBe("Envío gratis");
    expect(cintaDestacada({ medios: [], financiacion: [], promociones: [], cinta: null })).toBeNull();
  });
});
