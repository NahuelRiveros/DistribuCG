---
name: pagos-webhooks
description: Integración de pagos online (Mercado Pago u otro) y webhooks — crear el cobro, verificar firma, evitar procesar dos veces, actualizar pedido y cobros. Usar al activar el módulo pagos_online o modificar cobros online.
argument-hint: <proveedor, ej. "mercadopago">
---

# Pagos online: $ARGUMENTS

Módulo `pagos_online` (depende de `tienda`). DistribuCG tiene un `mercadopago_service.js` de suscripciones que sirve de referencia para el SDK, no para el flujo.

1. Leer la documentación oficial vigente del proveedor antes de escribir código.
2. `servidor/src/modulos/pagos_online/proveedores/<proveedor>.js` exporta siempre las mismas funciones: `crearCobro`, `verificarWebhook`, `consultarPago`. El resto del sistema no conoce el SDK.
3. Crear cobro: el monto sale del **saldo del pedido en la base**, nunca del navegador. Guardar `pago_online` (proveedor, `id_externo` único, estado, monto).
4. Webhook `POST /api/pagos/webhook/<proveedor>`:
   - Verificar firma con el body crudo; si falla → 401.
   - **No procesar dos veces**: tabla `webhook_evento` con `id_evento` único; si ya existe → 200 sin hacer nada.
   - No confiar en el contenido: consultar el estado real con `consultarPago`.
   - En una transacción: actualizar `pago_online`, registrar `pedido_cobro` (método `mercadopago`), recalcular estado de cobro del pedido.
   - Responder 200 rápido; mails fuera de la transacción.
5. Credenciales solo en `.env` vía `nucleo/env.js`. Nunca loguear tokens ni datos de tarjeta.
6. Tests: firma inválida, evento repetido, pago aprobado, rechazado, monto distinto al esperado.
7. Probar local con túnel (cloudflared/ngrok) y documentar el paso.
