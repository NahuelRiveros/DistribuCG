import { describe, expect, it } from "vitest";
import { proyecto } from "../proyecto.js";
import { pagosSchema } from "./configuracion.js";

const valida = () => structuredClone(proyecto.pagos);
const errores = (datos) => pagosSchema.safeParse(datos).error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`) ?? [];

describe("pagosSchema", () => {
  it("la configuración inicial del proyecto es válida", () => {
    expect(errores(valida())).toEqual([]);
  });

  it("rechaza un CBU con un número mal tipeado y un alias con espacios", () => {
    const datos = valida();
    datos.datos_transferencia.cbu = "2850590940090418135202";
    datos.datos_transferencia.alias = "mi alias";
    expect(errores(datos)).toEqual([
      "datos_transferencia.cbu: El CBU no es válido: revisá los 22 números (tiene dígitos de control)",
      "datos_transferencia.alias: El alias tiene de 6 a 20 caracteres: letras, números, puntos o guiones",
    ]);
  });

  it("un plan con interés exige el CFT", () => {
    const datos = valida();
    datos.financiacion[0].planes.push({ cuotas: 12, interes: 35 });
    expect(errores(datos)).toContain(`financiacion.0.planes.${datos.financiacion[0].planes.length - 1}.cft: Con interés, completá el CFT (lo exige la ley)`);
  });

  it("no deja quitar medios base, dejar la tienda sin medios ni ofrecer transferencia sin CBU", () => {
    const sinUno = valida();
    sinUno.medios.pop();
    expect(errores(sinUno)).toContain("medios: Faltan o se repiten medios de pago");

    const ninguno = valida();
    ninguno.medios.forEach((m) => (m.en_tienda = false));
    expect(errores(ninguno)).toContain("medios: Dejá al menos un medio de pago habilitado para la tienda");

    const sinCbu = valida();
    sinCbu.datos_transferencia = null;
    expect(errores(sinCbu)).toContain("datos_transferencia: Si ofrecés transferencia, cargá el CBU para que el cliente sepa a dónde pagar");
  });

  it("un descuento de 100 % se toma como error de tipeo", () => {
    const datos = valida();
    datos.medios[0].descuento = 100;
    expect(errores(datos)).toContain("medios.0.descuento: El descuento: máximo 90");
  });
});
