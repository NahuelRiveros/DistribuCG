import { projectModules } from "./gate_config.js";
// Políticas compartidas por API y navegador; nunca incluir secretos.
export const clientConfig = {
  id: "gc",
  auth: { publicRegistration: projectModules.eccomerce_distribuidora, passwordMinLength: 8, passwordMaxLength: 72, resetMinutes: 20, sesionClienteDias: 30, sesionPersonalHoras: 24 },
  // Catálogo y carrito de la tienda (las reglas del carrito del core leen estos límites).
  tienda: { publicCatalog: true, guestCart: true, pageSize: 24, maxQuantity: 9999, maxCartLines: 200, cartTtlDays: 30 },
  // Datos que ve el comprador para pagar. [COMPLETAR] con los reales del cliente antes de publicar.
  transferencia: {
    titular: "[DC SRL titular de la cuenta]",
    banco: "[Banco Hipotecario]",
    cbu: "[00254655288645165482]",
    alias: "[DC_SRL_ALIAS]",
    cuit: "[12345678901]",
  },
  // Datos fiscales de quien factura (ver core/fiscal_config.js). Condición frente al IVA: define si factura A/B o C.
  // [COMPLETAR] con la del cliente ("responsable_inscripto", "monotributista" o "exento").
  // Mientras sea null no se sugiere tipo de factura.
  // El resto no viaja a ARCA: lo tiene que mostrar el PDF de la factura. No son secretos
  // (van impresos en cada factura), por eso viven acá y no en variables de entorno.
  emisorFiscal: {
    condicion_iva: null,
    razon_social: null, // [COMPLETAR] como figura en ARCA
    domicilio_comercial: null, // [COMPLETAR] calle, número, localidad
    ingresos_brutos: null, // [COMPLETAR] número de IIBB o "Convenio Multilateral …"
    inicio_actividades: null, // [COMPLETAR] "AAAA-MM-DD"
  },
};
