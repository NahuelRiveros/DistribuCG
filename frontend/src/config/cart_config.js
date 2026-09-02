// CARRITO Y CHECKOUT — config por proyecto/cliente.
// enableCart lee de gate_config.js (el gate maestro). El módulo
// src/modules/eccomerce_indumentaria/ existe en el código pero no se activa
// (ni ruta, ni ícono en el navbar, ni CartProvider) hasta que
// projectModules.eccomerce_indumentaria sea true. Ver
// src/modules/eccomerce_indumentaria/CHANGELOG.md para qué trae el módulo
// y qué falta cablear (rutas, backend) para activarlo.
import { projectModules } from "./gate_config.js";

export const cartConfig = {

  // ── ¿Qué está habilitado? ──────────────────────────────────────────────────

  // Activa el carrito de compras y la ruta /carrito.
  // Requiere que el backend tenga activos los endpoints de /carrito.
  enableCart: projectModules.eccomerce_indumentaria,

  // Estos dos NO dependen de gate_config.js — son ajuste fino dentro del
  // módulo eccomerce_indumentaria ya habilitado (¿está listo el backend de checkout?
  // ¿hay pasarela de pago conectada?), se prenden a mano cuando corresponda.
  // Activa el flujo de checkout al finalizar la compra. Requiere enableCart: true.
  enableCheckout: false,

  // Activa el pago online (ej. MercadoPago). Requiere enableCheckout: true.
  enablePayments: false,

  // Botón principal en la ficha de cada producto:
  // "whatsapp" → abre WhatsApp con el producto (catálogo sin compra online)
  // "cart"     → agrega al carrito (requiere enableCart: true)
  // "none"     → sin botón de acción
  productDetailCta: "whatsapp",


  // ── Métodos de pago ────────────────────────────────────────────────────────

  // Opciones: "mercadopago" | "transferencia" | "efectivo"
  metodosHabilitados: ["transferencia"],

  // Tarjetas que acepta el negocio (logos en el footer).
  // Opciones: "visa" | "mastercard" | "amex" | "naranja" | "cabal"
  tarjetasAceptadas: [],


  // ── Envío y descuentos ────────────────────────────────────────────────────

  enableEnvio: true,
  // Monto mínimo para envío gratis. null = no aplica.
  envioGratisDesde: null,
  enableCupones: false,


  // ── Límites del carrito ────────────────────────────────────────────────────

  cantidadMaxPorItem: 99,
  maxItemsEnCarrito: 20,
  // Días de inactividad antes de que el backend limpie el carrito del usuario.
  cartTtlDias: 30,


  // ── Validaciones automáticas ───────────────────────────────────────────────
  // Dependen de lo que devuelve el backend — ver cabecera de
  // src/modules/carrito/validations/cart_staleness.js.

  validarStockAlAgregar: true,
  validarPreciosAlAbrir: true,
  validarVariantesAlAbrir: true,
  autoRemoverProductosInactivos: true,

};

// true cuando el carrito y el checkout están habilitados (modo ecommerce completo)
export function isEcommerceMode() {
  return cartConfig.enableCart && cartConfig.enableCheckout;
}
