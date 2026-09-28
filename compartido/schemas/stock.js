import { z } from "../zod.js";
import { proyecto } from "../proyecto.js";
import { idSchema, importeOpcional, paginacionQuery, textoOpcional } from "./comunes.js";

const entero = (etiqueta, { min = 0 } = {}) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number({ error: `${etiqueta} es obligatoria` }).int(`${etiqueta} tiene que ser un número entero`).min(min, min > 0 ? `${etiqueta} tiene que ser mayor a 0` : `${etiqueta} no puede ser negativa`).max(1_000_000, `${etiqueta} es demasiado grande`),
  );

export const ESTADOS_STOCK = ["todos", "controlados", "bajo", "sin_stock", "sin_control"];

export const existenciasQuery = z.object({
  q: z.string().trim().max(120).optional(),
  categoria: idSchema.optional(),
  estado: z.enum(ESTADOS_STOCK).optional().default("todos"),
  ...paginacionQuery,
});

export const configurarStockSchema = z
  .object({
    controla_stock: z.boolean().optional(),
    minimo: entero("La cantidad mínima").optional(),
  })
  .refine((d) => d.controla_stock !== undefined || d.minimo !== undefined, "Indicá qué querés cambiar");

export const ingresoSchema = z.object({
  items: z
    .array(
      z.object({
        variante_id: idSchema,
        cantidad: entero("La cantidad", { min: 1 }),
        costo_unitario: importeOpcional("El costo"),
      }),
    )
    .min(1, "Agregá al menos un producto")
    .max(200, "Máximo 200 productos por ingreso")
    .refine((items) => new Set(items.map((i) => i.variante_id)).size === items.length, "Hay una presentación repetida: sumá las cantidades en una sola línea"),
  referencia: textoOpcional(60, "El remito o factura"),
  motivo: textoOpcional(200, "La observación"),
});

export const MODOS_AJUSTE = ["sumar", "restar", "fijar"];

export const ajusteSchema = z.object({
  variante_id: idSchema,
  // sumar/restar una diferencia, o fijar la cantidad que dio un conteo
  modo: z.enum(MODOS_AJUSTE, { error: "Elegí cómo ajustar" }),
  cantidad: entero("La cantidad"),
  motivo: z
    .string({ error: "Indicá el motivo del ajuste" })
    .trim()
    .min(3, "Indicá el motivo del ajuste")
    .max(200, "El motivo puede tener hasta 200 caracteres"),
});

export const movimientosQuery = z.object({ ...paginacionQuery });

export const motivosAjuste = proyecto.stock.motivos_ajuste;
