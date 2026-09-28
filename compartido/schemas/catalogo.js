import { z } from "../zod.js";
import { proyecto } from "../proyecto.js";
import { comaDecimal, idSchema, importe, importeOpcional, paginacionQuery, textoObligatorio, textoOpcional } from "./comunes.js";

const { etiqueta_variante, etiqueta_variantes, iva_por_defecto } = proyecto.catalogo;

// ── Categorías ──────────────────────────────────────────────────────────────

export const categoriaSchema = z.object({
  nombre: textoObligatorio(80, "El nombre"),
  padre_id: z.preprocess((v) => (v === "" || v === 0 ? null : v), idSchema.nullable()).optional().default(null),
  orden: z.coerce.number().int().min(0).max(9999).optional().default(0),
  en_menu: z.boolean().optional().default(false),
});

// ── Presentaciones (variantes) ──────────────────────────────────────────────

export const varianteSchema = z
  .object({
    // Con id = se actualiza esa presentación; sin id = se crea una nueva.
    id: idSchema.optional(),
    nombre: textoOpcional(100, "El nombre"),
    sku: textoOpcional(60, "El código / SKU"),
    // Características según el rubro: { talle: "M", color: "Negro" } o { peso: "118 g" }
    atributos: z.record(z.string().trim().max(40), z.string().trim().max(60)).optional().default({}),
    precio: importe("El precio"),
    precio_anterior: importeOpcional("El precio anterior"),
    iva_porcentaje: z.coerce.number().min(0, "IVA entre 0 y 100").max(100, "IVA entre 0 y 100").optional().default(iva_por_defecto),
    controla_stock: z.boolean().optional().default(false),
    activo: z.boolean().optional().default(true),
  })
  .refine((v) => v.precio_anterior == null || v.precio_anterior > v.precio, {
    path: ["precio_anterior"],
    message: "El precio anterior tiene que ser mayor al precio actual (se muestra como oferta)",
  });

// ── Productos ───────────────────────────────────────────────────────────────

export const productoSchema = z
  .object({
    categoria_id: z.coerce.number({ error: "Elegí una categoría" }).int("Elegí una categoría").positive("Elegí una categoría"),
    nombre: textoObligatorio(150, "El nombre"),
    marca: textoOpcional(80, "La marca"),
    descripcion: textoOpcional(5000, "La descripción"),
    activo: z.boolean().optional().default(true),
    publicado: z.boolean().optional().default(true),
    variantes: z
      .array(varianteSchema, { error: `Agregá al menos una ${etiqueta_variante.toLowerCase()}` })
      .min(1, `Agregá al menos una ${etiqueta_variante.toLowerCase()}`)
      .max(100, `Máximo 100 ${etiqueta_variantes.toLowerCase()} por producto`),
  })
  .superRefine((producto, ctx) => {
    const skus = new Set();
    const nombres = new Set();
    producto.variantes.forEach((v, i) => {
      if (v.sku) {
        const clave = v.sku.toLowerCase();
        if (skus.has(clave)) ctx.addIssue({ code: "custom", path: ["variantes", i, "sku"], message: "Código repetido en este producto" });
        skus.add(clave);
      }
      const nombre = (v.nombre ?? "").toLowerCase();
      if (nombres.has(nombre)) {
        ctx.addIssue({ code: "custom", path: ["variantes", i, "nombre"], message: `Hay dos ${etiqueta_variantes.toLowerCase()} con el mismo nombre` });
      }
      nombres.add(nombre);
    });
  });

export const estadoProductoSchema = z
  .object({ activo: z.boolean().optional(), publicado: z.boolean().optional() })
  .refine((v) => v.activo !== undefined || v.publicado !== undefined, "Indicá activo o publicado");

export const ORDENES_PRODUCTO = ["nombre", "-nombre", "reciente"];
export const ESTADOS_PRODUCTO = ["todos", "activos", "inactivos", "sin_publicar"];

export const listarProductosQuery = z.object({
  q: z.string().trim().max(120).optional(),
  categoria: idSchema.optional(),
  orden: z.enum(ORDENES_PRODUCTO).optional().default("nombre"),
  // Solo productos con alguna presentación rebajada (precio anterior mayor al actual).
  oferta: z.preprocess((v) => v === true || v === "1" || v === "true", z.boolean()).optional(),
  // Solo para admin/staff; el público siempre ve lo publicado.
  estado: z.enum(ESTADOS_PRODUCTO).optional().default("todos"),
  ...paginacionQuery,
});

export const claveProductoParams = z.object({
  clave: z.string().trim().min(1).max(200),
});

// ── Ajuste masivo de precios ────────────────────────────────────────────────

export const ajustePreciosSchema = z
  .object({
    porcentaje: z.preprocess(
      (v) => comaDecimal(typeof v === "string" && v.trim() === "" ? undefined : v),
      z.coerce
        .number({ error: "Ingresá un porcentaje" })
        .min(-90, "No se puede bajar más de 90 %")
        .max(500, "No se puede subir más de 500 %")
        .refine((v) => v !== 0, "El porcentaje no puede ser 0")
        .refine((v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6, "Máximo 2 decimales"),
    ),
    categoria_id: z.preprocess((v) => (v === "" || v == null ? undefined : v), idSchema.optional()),
    todo_el_catalogo: z.boolean().optional().default(false),
    // true = solo calcular cuántas presentaciones cambian y mostrar ejemplos, sin guardar
    simular: z.boolean().optional().default(false),
  })
  .refine((d) => Boolean(d.categoria_id) !== d.todo_el_catalogo, {
    path: ["categoria_id"],
    message: "Elegí una categoría o confirmá aplicar a todo el catálogo",
  });

// ── Imágenes ────────────────────────────────────────────────────────────────

export const imagenParams = z.object({ id: idSchema, imagenId: idSchema });

export const imagenUrlSchema = z.object({
  url: z
    .string({ error: "Pegá la dirección de la imagen" })
    .trim()
    .max(500, "La dirección es demasiado larga")
    .url("Tiene que ser una dirección web válida")
    .refine((u) => u.startsWith("https://"), "La dirección tiene que empezar con https://"),
  alt: textoOpcional(150, "La descripción"),
});

export const ordenImagenesSchema = z.object({
  ids: z.array(idSchema).min(1).max(50),
});
