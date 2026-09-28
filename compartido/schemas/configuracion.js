import { z } from "../zod.js";
import { aliasValido, cbuValido, cuitValido, soloDigitos } from "../reglas/bancarios.js";
import { esFechaValida } from "../reglas/fechas.js";
import { LOGOS_MEDIOS, MEDIOS_BASE } from "../reglas/pagos.js";
import { textoObligatorio } from "./comunes.js";

// Configuración de pagos que se edita en el panel (Configuración → Pagos).
// El mismo schema valida el formulario y lo que guarda el servidor.

export const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const vacioANull = (v) => (typeof v === "string" && v.trim() === "" ? null : v);
const textoOpcional = (max, etiqueta) =>
  z.preprocess(vacioANull, z.string().trim().max(max, `${etiqueta} puede tener hasta ${max} caracteres`).nullable()).optional();
const logos = z.array(z.enum(LOGOS_MEDIOS)).max(LOGOS_MEDIOS.length).default([]);
const numero = (etiqueta, { min, max, entero = false }) => {
  let n = z.coerce.number({ error: `${etiqueta}: ingresá un número` });
  if (entero) n = n.int(`${etiqueta}: tiene que ser un número entero`);
  return n.min(min, `${etiqueta}: mínimo ${min}`).max(max, `${etiqueta}: máximo ${max}`);
};

const medioSchema = z.object({
  valor: z.enum(MEDIOS_BASE),
  etiqueta: textoObligatorio(40, "El nombre"),
  en_tienda: z.boolean(),
  // Más de 90 % casi seguro es un error de tipeo (ej. 100 en vez de 10).
  descuento: numero("El descuento", { min: 0, max: 90 }),
  detalle: textoOpcional(160, "La aclaración"),
  logos,
});

const planSchema = z
  .object({
    cuotas: numero("Las cuotas", { min: 1, max: 60, entero: true }),
    interes: numero("El interés", { min: 0, max: 500 }),
    cft: textoOpcional(60, "El CFT"),
    activo: z.boolean().default(true),
  })
  // Con interés, la ley exige informar el costo financiero total.
  .refine((p) => p.interes === 0 || Boolean(p.cft), { path: ["cft"], message: "Con interés, completá el CFT (lo exige la ley)" });

const opcionSchema = z.object({
  nombre: textoObligatorio(60, "El nombre"),
  medio: z.enum(MEDIOS_BASE, { error: "Elegí con qué medio se cobra" }),
  logos,
  planes: z.array(planSchema).min(1, "Agregá al menos un plan de cuotas").max(20),
});

const promocionSchema = z.object({
  banco: textoObligatorio(60, "El banco"),
  detalle: textoObligatorio(160, "El beneficio"),
  dias: z.array(z.enum(DIAS_SEMANA)).default([]),
  hasta: z.preprocess(vacioANull, z.string().refine(esFechaValida, "Elegí una fecha válida").nullable()).optional(),
  tope: textoOpcional(80, "El tope"),
  activo: z.boolean().default(true),
});

const datosTransferenciaSchema = z.object({
  titular: textoObligatorio(100, "El titular"),
  cuit: z.preprocess(vacioANull, z.string().refine(cuitValido, "El CUIT no es válido: revisá los números").nullable()).optional(),
  banco: textoOpcional(60, "El banco"),
  cbu: z.preprocess(
    (v) => (typeof v === "string" ? soloDigitos(v) : v),
    z.string({ error: "Ingresá el CBU" }).refine(cbuValido, "El CBU no es válido: revisá los 22 números (tiene dígitos de control)"),
  ),
  alias: z.preprocess(vacioANull, z.string().trim().refine(aliasValido, "El alias tiene de 6 a 20 caracteres: letras, números, puntos o guiones").nullable()).optional(),
});

export const pagosSchema = z
  .object({
    medios: z.array(medioSchema),
    // null = no se muestran datos para transferir
    datos_transferencia: datosTransferenciaSchema.nullable(),
    financiacion: z.array(opcionSchema).max(20),
    promociones: z.array(promocionSchema).max(30),
    cinta: textoOpcional(160, "La cinta"),
  })
  .superRefine((p, ctx) => {
    // Los medios base van todos, una vez cada uno (los usan cobros y Caja).
    const valores = p.medios.map((m) => m.valor);
    if (valores.length !== MEDIOS_BASE.length || MEDIOS_BASE.some((v) => !valores.includes(v))) {
      ctx.addIssue({ code: "custom", path: ["medios"], message: "Faltan o se repiten medios de pago" });
    }
    if (!p.medios.some((m) => m.en_tienda)) {
      ctx.addIssue({ code: "custom", path: ["medios"], message: "Dejá al menos un medio de pago habilitado para la tienda" });
    }
    const transferencia = p.medios.find((m) => m.valor === "transferencia");
    if (transferencia?.en_tienda && !p.datos_transferencia) {
      ctx.addIssue({ code: "custom", path: ["datos_transferencia"], message: "Si ofrecés transferencia, cargá el CBU para que el cliente sepa a dónde pagar" });
    }
  });
