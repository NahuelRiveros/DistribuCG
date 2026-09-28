import { z } from "../zod.js";

// Piezas reutilizables para schemas. Los formularios mandan "" en campos vacíos:
// estos helpers lo convierten en null/undefined antes de validar.

const vacioANull = (v) => (typeof v === "string" && v.trim() === "" ? null : v);
const vacioAUndefined = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const idSchema = z.coerce.number({ error: "Id inválido" }).int("Id inválido").positive("Id inválido");

export const idParams = z.object({ id: idSchema });

export function textoOpcional(max, etiqueta = "El texto") {
  return z.preprocess(vacioANull, z.string().trim().max(max, `${etiqueta} puede tener hasta ${max} caracteres`).nullable()).optional();
}

export function textoObligatorio(max, etiqueta) {
  return z
    .string({ error: `${etiqueta} es obligatorio` })
    .trim()
    .min(1, `${etiqueta} es obligatorio`)
    .max(max, `${etiqueta} puede tener hasta ${max} caracteres`);
}

// "1234,50" (coma decimal, como se escribe en Argentina) → "1234.50"
export const comaDecimal = (v) => (typeof v === "string" && /^\s*-?\d+,\d+\s*$/.test(v) ? v.replace(",", ".") : v);

/** Importe con hasta 2 decimales (se guarda como DECIMAL(12,2)). Acepta coma decimal. */
export function importe(etiqueta) {
  return z.preprocess(
    (v) => comaDecimal(vacioAUndefined(v)),
    z.coerce
      .number({ error: `${etiqueta} es obligatorio` })
      .min(0, `${etiqueta} no puede ser negativo`)
      .max(9_999_999_999.99, `${etiqueta} es demasiado grande`)
      .refine((v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6, `${etiqueta}: máximo 2 decimales`),
  );
}

export function importeOpcional(etiqueta) {
  return z.preprocess(vacioANull, importe(etiqueta).nullable()).optional();
}

export const paginacionQuery = {
  pagina: z.coerce.number().int().min(1).optional(),
  limite: z.coerce.number().int().min(1).max(100).optional(),
};
