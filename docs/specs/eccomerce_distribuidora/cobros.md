# Módulo: cobros y comprobantes (`COB`)

## Objetivo

Saber en todo momento cuánto pagó y cuánto debe cada pedido, sin cobrar dos veces y sin perder
rastro de ningún movimiento de dinero, aunque el sistema no procese pagos.

## Alcance

- **Incluye:** registrar y anular cobros, el saldo de cada pedido, los comprobantes de transferencia que
  adjunta el cliente y su revisión.
- **No incluye:** los estados del pedido ([pedidos.md](pedidos.md)) ni la suscripción del software, que sí
  usa MercadoPago ([../core/sistema.md](../core/sistema.md)).
- **No hay pasarela de pago:** registrar un cobro declara dinero que ya se recibió.

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Cliente | Ver los datos para transferir, adjuntar comprobantes y ver si fueron aceptados o rechazados. |
| Rol con "Registrar cobros" | Registrar y anular cobros; aceptar o rechazar comprobantes. |
| Rol con "Ver pedidos" (sin cobros) | Ver los cobros y los comprobantes, sin tocarlos. |

## Reglas

### Cobros

| Código | Regla | Estado |
| --- | --- | --- |
| COB-01 | El cobro es independiente del estado del pedido: **Sin cobros**, **Cobro parcial** o **Cobrado**. | ✅ `checkout.integration.mjs` › "cobros: reintentos, saldo máximo y anulación auditada" |
| COB-02 | Se registra dinero ya recibido, con su medio: efectivo, transferencia u otro. | ✅ mismo test que COB-01 |
| COB-03 | No se puede registrar más que el saldo, ni un cobro nuevo en un pedido cancelado. | ✅ mismo test que COB-01 |
| COB-04 | Anular un cobro pide motivo, no devuelve dinero y el registro se conserva para auditoría. | ✅ mismo test que COB-01 |
| COB-05 | Si la respuesta de un cobro no llegó, "Verificar registro pendiente" consulta la misma operación: no se registra dos veces. | ✅ mismo test que COB-01 |
| COB-06 | Los cobros viejos sin medio cargado se muestran como "Medio no informado". | ⚠️ sin test |
| COB-07 | Cancelar un pedido con cobros no hace desaparecer ese dinero: queda registrado y se resuelve por fuera del sistema. | ⚠️ sin test |
| COB-08 | El historial de cobros se puede abrir desde cualquier pantalla de la gestión. | ✅ `storefront.spec.js` › "staff gestiona notas y registra cobros con historial en cualquier pantalla" |

### Comprobantes de transferencia

| Código | Regla | Estado |
| --- | --- | --- |
| COB-10 | El único medio de pago del cliente es la transferencia; ve titular, banco, CBU, alias y CUIT de la distribuidora. | ⚠️ sin test · ❓ ver pregunta 1 |
| COB-11 | El cliente adjunta JPG, PNG, WEBP o PDF de hasta 5 MB, como máximo 5 por pedido, desde el pedido enviado o "Mis pedidos". No puede en pedidos cancelados o ya cobrados. | ✅ `ux_rules.test.mjs` › "comprobantes: se reconocen por contenido y no se adjuntan a pedidos cancelados, cobrados o llenos"; `storefront.spec.js` › "comprador adjunta el comprobante de transferencia, ve el rechazo y lo abre" |
| COB-12 | El formato se reconoce por el contenido del archivo, no por su nombre. | ✅ `ux_rules.test.mjs` › mismo test que COB-11 |
| COB-13 | El archivo se guarda privado. Para verlo se genera un enlace que dura 5 minutos, solo para el dueño del pedido o el equipo. | ✅ `checkout.integration.mjs` › "comprobantes: archivo real y privado, rechazo, aceptación con cobro, anulación y permisos" |
| COB-14 | Cada comprobante está **En revisión**, **Aceptado** o **Rechazado**. El rechazo lleva motivo y se le avisa al cliente por correo. | ✅ mismo test que COB-13 |
| COB-15 | Aceptar registra, en el mismo paso, un cobro por transferencia por el importe que indica quien revisa; no se puede aceptar dos veces. | ✅ mismo test que COB-13; `storefront.spec.js` › "gestión revisa comprobantes: staff acepta con el importe o rechaza con motivo; el vendedor no cobra" |
| COB-16 | Si se anula el cobro de un comprobante aceptado, el comprobante vuelve a revisión. | ✅ `checkout.integration.mjs` › mismo test que COB-13 |
| COB-17 | Aceptar, rechazar, registrar y anular piden "Registrar cobros": el vendedor ve los comprobantes pero no mueve dinero. | ✅ `storefront.spec.js` › mismo test que COB-15 |
| COB-18 | La gestión filtra por "Comprobante para revisar" y "Sin comprobante" (sin ninguno o solo rechazados). | ⚠️ sin test |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Datos para transferir | `client_config.js` › `transferencia` | `[COMPLETAR]` (ver pregunta 1) |
| Formatos, tamaño y cantidad de comprobantes | `order_config.js` › `receipts` | JPG, PNG, WEBP, PDF · 5 MB · 5 por pedido |
| Medios de cobro | `order_config.js` › `paymentMethods` | Efectivo, transferencia, otro |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/routes/nota_pedido_router.js` (cobros y comprobantes) →
  `controllers/comprobantes_controller.js` y `nota_pedido_controller.js` → `services/comprobantes_service.js`,
  `comprobante_rules.js` y `nota_pedido_service.js`; subida privada en `services/common/upload_service.js`.
- Frontend: `controls/pedidos/` (resumen de importes y formulario de cobro) y
  `modules/eccomerce_distribuidora/pedidos/`.

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-10 | COB-10 | Único medio de pago del cliente: transferencia, con comprobante opcional que el personal acepta o rechaza (relevamiento, punto 6). | Cliente |
| 2026-10 | COB-17 | Solo supervisor y admin registran cobros; el vendedor solo gestiona pedidos (relevamiento, punto 9). | Cliente |

## Preguntas abiertas

1. **COB-10 — Datos bancarios reales.** Los datos que ve el cliente para transferir (titular, banco, CBU,
   alias, CUIT) siguen como `[COMPLETAR]` en `client_config.js`: hoy un cliente vería datos de ejemplo.
   No es una decisión, es un dato: ¿ya los tenés? Si los pasás, se cargan; **no los pegues en el chat si
   preferís**, podés escribirlos vos directo en `client_config.js`.
   **Respuesta:** ⏳ Esperando al cliente (2026-11-08: todavía no están los datos de la cuenta de la empresa;
   mientras no haya facturación, el cliente transfiere a esa cuenta).
