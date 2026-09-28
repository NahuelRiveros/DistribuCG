import { z } from "compartido/zod.js";
import { pagosSchema } from "compartido/schemas/configuracion.js";

// Diferencias entre la config guardada y el formulario:
//   - datos_transferencia: en el formulario siempre es un objeto; se guarda null si no hay CBU ni alias.
//   - cinta_personalizada: casilla del formulario; si no está marcada, la cinta se arma sola (null).
//   - los grupos de casillas (logos, días) pueden llegar vacíos como false.

const CAMPOS_TRANSFERENCIA = ["cbu", "alias", "titular", "cuit", "banco"];
const lista = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const vacio = (v) => !String(v ?? "").trim();

/** Tarjetas que se pueden aceptar (los otros logos son de billeteras/financieras). */
export const LOGOS_TARJETAS = ["visa", "mastercard", "cabal", "naranja_x"];

/**
 * Con qué se ofrecen cuotas. Al agregar una opción, nombre, medio y logos salen de acá
 * (logos null = los de las tarjetas elegidas en "Medios de pago").
 */
export const PROVEEDORES_CUOTAS = [
  { id: "mercado_pago", nombre: "Mercado Pago", medio: "mercado_pago", logos: ["mercado_pago"] },
  { id: "tarjeta", nombre: "Tarjeta de crédito", medio: "tarjeta", logos: null },
  { id: "go_cuotas", nombre: "GoCuotas (tarjeta de débito)", medio: "tarjeta", logos: ["go_cuotas"] },
];

/**
 * Config guardada → valores iniciales del formulario. Completa los campos opcionales que falten:
 * si no, el formulario los agrega al dibujarse y cree que hay "cambios sin guardar" sin haber tocado nada.
 */
export function aFormulario(valor) {
  return {
    medios: valor.medios.map((m) => ({ ...m, detalle: m.detalle ?? "", logos: m.logos ?? [] })),
    datos_transferencia: Object.fromEntries(CAMPOS_TRANSFERENCIA.map((k) => [k, valor.datos_transferencia?.[k] ?? ""])),
    financiacion: valor.financiacion.map((o) => ({
      ...o,
      logos: o.logos ?? [],
      planes: o.planes.map((p) => ({ ...p, cft: p.cft ?? "", activo: p.activo ?? true })),
    })),
    promociones: valor.promociones.map((p) => ({ ...p, dias: p.dias ?? [], hasta: p.hasta ?? "", tope: p.tope ?? "", activo: p.activo ?? true })),
    cinta_personalizada: Boolean(valor.cinta),
    cinta: valor.cinta ?? "",
  };
}

/** Valores del formulario → forma de la config (antes de validar). */
export function normalizar(v) {
  const datos = v.datos_transferencia ?? {};
  return {
    medios: (v.medios ?? []).map((m) => ({ ...m, logos: lista(m.logos) })),
    // Sin CBU ni alias no hay datos para transferir (si se ofrece transferencia, el schema los exige).
    datos_transferencia: vacio(datos.cbu) && vacio(datos.alias) ? null : datos,
    financiacion: (v.financiacion ?? []).map((o) => ({ ...o, logos: lista(o.logos) })),
    promociones: (v.promociones ?? []).map((p) => ({ ...p, dias: lista(p.dias) })),
    cinta: v.cinta_personalizada ? v.cinta : null,
  };
}

/** El mismo schema que usa el servidor, aplicado sobre los valores normalizados. */
export const formularioPagosSchema = z.preprocess(normalizar, pagosSchema);
