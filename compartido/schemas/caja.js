import { z } from "../zod.js";
import { proyecto } from "../proyecto.js";
import { esFechaValida, hoyEn } from "../reglas/fechas.js";
import { idSchema, importe, paginacionQuery, textoObligatorio, textoOpcional } from "./comunes.js";

export const TIPOS_CAJA = ["ingreso", "egreso"];
const MEDIOS = proyecto.caja.medios.map((m) => m.valor);

const campoFecha = z.string({ error: "Elegí la fecha" }).refine(esFechaValida, "Elegí una fecha válida");
const campoAnio = z.coerce.number().int().min(2000, "Año inválido").max(2100, "Año inválido");

export const movimientoCajaSchema = z.object({
  tipo: z.enum(TIPOS_CAJA, { error: "Indicá si es ingreso o egreso" }),
  // Se cargan días pasados (gastos atrasados), nunca futuros: la caja registra lo que ya pasó.
  fecha: campoFecha.refine((f) => f <= hoyEn(), "No se pueden cargar movimientos de días que todavía no pasaron"),
  monto: importe("El monto").refine((v) => v > 0, "El monto tiene que ser mayor a 0"),
  // El <select> manda "" si no se eligió nada.
  categoria_id: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number({ error: "Elegí una categoría" }).int().positive("Elegí una categoría")),
  medio: z.enum(MEDIOS, { error: "Elegí el medio de pago" }),
  descripcion: textoOpcional(200, "La descripción"),
});

export const anularMovimientoSchema = z.object({
  motivo: textoObligatorio(300, "El motivo").refine((v) => v.length >= 3, "Contá brevemente por qué se anula"),
});

export const categoriaCajaSchema = z.object({
  tipo: z.enum(TIPOS_CAJA, { error: "Indicá si es de ingresos o de egresos" }),
  nombre: textoObligatorio(60, "El nombre"),
});

export const categoriaCajaEditarSchema = z.object({
  nombre: textoObligatorio(60, "El nombre").optional(),
  activa: z.boolean().optional(),
  orden: z.coerce.number().int().min(0).max(9999).optional(),
});

export const anualQuery = z.object({ anio: campoAnio.optional() });

export const mesQuery = z.object({
  anio: campoAnio,
  mes: z.coerce.number().int().min(1, "Mes inválido").max(12, "Mes inválido"),
});

// origen: "manual" = cargados en la Caja, "tienda" = cobros de pedidos.
export const movimientosCajaQuery = z.object({
  desde: campoFecha.optional(),
  hasta: campoFecha.optional(),
  tipo: z.enum(TIPOS_CAJA).optional(),
  categoria_id: idSchema.optional(),
  medio: z.enum(MEDIOS).optional(),
  origen: z.enum(["manual", "tienda"]).optional(),
  ...paginacionQuery,
});

export const exportarCajaQuery = z.object({ anio: campoAnio });
