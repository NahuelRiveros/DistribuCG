import { z } from "../zod.js";
import { proyecto } from "../proyecto.js";
import { PROVINCIAS } from "../datos/provincias.js";
import { idSchema, importe, paginacionQuery, textoObligatorio, textoOpcional } from "./comunes.js";

const { max_cantidad_item, max_lineas_carrito, modalidades_entrega } = proyecto.tienda;

const cantidad = z.coerce
  .number({ error: "Ingresá una cantidad" })
  .int("La cantidad tiene que ser un número entero")
  .min(1, "La cantidad mínima es 1")
  .max(max_cantidad_item, `La cantidad máxima es ${max_cantidad_item}`);

// ── Datos de entrega del cliente ──

export const CONDICIONES_IVA = [
  { valor: "consumidor_final", etiqueta: "Consumidor final" },
  { valor: "monotributista", etiqueta: "Monotributista" },
  { valor: "responsable_inscripto", etiqueta: "Responsable inscripto" },
  { valor: "exento", etiqueta: "Exento" },
];

export const perfilSchema = z.object({
  telefono: z
    .string({ error: "Ingresá un teléfono" })
    .trim()
    .min(6, "Ingresá un teléfono")
    .max(40, "El teléfono es demasiado largo")
    .regex(/^[0-9+\-\s()]+$/, "El teléfono solo puede tener números, espacios, +, - y paréntesis"),
  direccion: textoObligatorio(200, "La dirección"),
  localidad: textoObligatorio(100, "La localidad"),
  provincia: z.enum(PROVINCIAS, { error: "Elegí una provincia" }),
  codigo_postal: textoOpcional(15, "El código postal"),
  indicaciones: textoOpcional(300, "Las indicaciones"),
  razon_social: textoOpcional(150, "La razón social"),
  cuit: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/[\s-]/g, "") || null : v),
    z.string().regex(/^\d{11}$/, "El CUIT tiene 11 números").nullable().optional(),
  ),
  condicion_iva: z.preprocess((v) => (v === "" ? null : v), z.enum(CONDICIONES_IVA.map((c) => c.valor)).nullable().optional()),
});

// ── Carrito ──

export const agregarItemSchema = z.object({ variante_id: idSchema, cantidad });
export const cambiarCantidadSchema = z.object({ cantidad });
export const itemParams = z.object({ id: idSchema });

// Carrito de invitado (guardado en el navegador): se cotiza o se fusiona al iniciar sesión.
export const itemsInvitadoSchema = z
  .array(z.object({ variante_id: idSchema, cantidad }))
  .max(max_lineas_carrito, `Máximo ${max_lineas_carrito} productos por pedido`);

export const cotizarSchema = z.object({ items: itemsInvitadoSchema });
export const fusionarSchema = z.object({ clave: z.uuid("Identificador inválido"), items: itemsInvitadoSchema });

// ── Pedidos (panel) ──

const ESTADOS = Object.keys(proyecto.pedidos.estados);
const METODOS_COBRO = proyecto.pedidos.metodos_cobro.map((m) => m.valor);

export const cambiarEstadoSchema = z.object({
  estado: z.enum(ESTADOS, { error: "Estado inválido" }),
  motivo: textoOpcional(500, "El motivo"),
  // El estado que vio quien opera: si otra persona lo cambió mientras tanto, se avisa.
  estado_actual: z.enum(ESTADOS).optional(),
});

export const cobroSchema = z.object({
  monto: importe("El monto").refine((v) => v > 0, "El monto tiene que ser mayor a 0"),
  metodo: z.enum(METODOS_COBRO, { error: "Elegí el medio de pago" }),
  nota: textoOpcional(255, "La nota"),
});

export const anularCobroSchema = z.object({
  motivo: z.string({ error: "Indicá el motivo" }).trim().min(3, "Indicá el motivo").max(300, "El motivo es demasiado largo"),
});

export const cobroParams = z.object({ id: idSchema, cobroId: idSchema });

export const listarPedidosQuery = z.object({
  q: z.string().trim().max(120).optional(),
  estado: z.enum(ESTADOS).optional(),
  estado_cobro: z.enum(["pendiente", "parcial", "cobrado"]).optional(),
  ...paginacionQuery,
});

export const misPedidosQuery = z.object({ ...paginacionQuery });

// ── Envío del pedido ──

export const enviarPedidoSchema = z.object({
  clave: z.uuid("Identificador inválido"), // evita que un doble click cree dos pedidos
  modalidad_entrega: z.enum(modalidades_entrega.map((m) => m.valor), { error: "Elegí cómo recibís el pedido" }),
  // Define el descuento (ej. transferencia). Los medios habilitados se editan en el panel,
  // así que el servidor valida contra la configuración vigente (no acá).
  medio_pago: z.string({ error: "Elegí cómo vas a pagar" }).trim().min(1, "Elegí cómo vas a pagar").max(30),
  // El % de descuento que vio el cliente: si se cambió en el panel mientras tanto, se le avisa.
  descuento_esperado: z.coerce.number().min(0).max(100),
  notas: textoOpcional(1000, "Las notas"),
  // Lo que el cliente vio al confirmar: si cambió algo (precio, cantidad), se le avisa.
  esperado: z
    .array(z.object({ variante_id: idSchema, cantidad, precio_final_unitario: z.coerce.number() }))
    .min(1, "El carrito está vacío"),
});
