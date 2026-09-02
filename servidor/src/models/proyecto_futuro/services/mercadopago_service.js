// =============================================================
// services/mercadopago_service.js
//
// Wrapper del SDK de MercadoPago v2.
//
// INSTALACIÓN REQUERIDA:
//   npm install mercadopago
//
// Variables de entorno necesarias en .env:
//   MP_ACCESS_TOKEN=TEST-xxxx  (sandbox) o APP_USR-xxxx (producción)
//   BACKEND_URL=https://mi-api.ngrok.io  (debe ser una URL pública)
//   FRONTEND_URL=http://localhost:5173
// =============================================================

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { env } from "../configuracion_servidor/env.js";

// Instancia única del cliente — se reutiliza en toda la app
const client = new MercadoPagoConfig({
  accessToken: env.MP_ACCESS_TOKEN,
  options: { timeout: 8000 },
});

const preferenceClient = new Preference(client);
const paymentClient    = new Payment(client);

// =============================================================
// crearPreferencia
// Genera una preferencia de pago en MP y devuelve el init_point.
//
// Params:
//   ordenId   — ID de la orden (se usa como external_reference)
//   total     — monto total en ARS
//   userEmail — email del comprador (para pre-llenar el form de MP)
//   items     — [{ nombre, cantidad, precio_unidad }] para mostrar en checkout MP
// =============================================================

export async function crearPreferencia({ ordenId, total, userEmail, items }) {
  const mpItems = items.map((i) => ({
    id:          String(i.producto_id ?? ordenId),
    title:       i.nombre,
    quantity:    i.cantidad,
    currency_id: "ARS",
    unit_price:  parseFloat(i.precio_unidad ?? i.precio ?? 0),
  }));

  const response = await preferenceClient.create({
    body: {
      items: mpItems,
      payer: { email: userEmail },
      back_urls: {
        success: `${env.FRONTEND_URL}/confirmacion/${ordenId}?status=approved`,
        failure: `${env.FRONTEND_URL}/confirmacion/${ordenId}?status=failure`,
        pending: `${env.FRONTEND_URL}/confirmacion/${ordenId}?status=pending`,
      },
      auto_return:        "approved",
      external_reference: String(ordenId),
      // MP llama a este endpoint cuando el pago se procesa
      notification_url:   `${env.BACKEND_URL}/api/pagos/webhook`,
    },
  });

  return {
    preference_id: response.id,
    // sandbox_init_point en test, init_point en producción
    init_point: env.NODE_ENV === "production"
      ? response.init_point
      : response.sandbox_init_point,
  };
}

// =============================================================
// obtenerPago
// Consulta el estado de un pago por su ID (payment_id de MP).
// Lo usa el webhook y el endpoint de verificación del frontend.
// =============================================================

export async function obtenerPago(paymentId) {
  const pago = await paymentClient.get({ id: paymentId });
  return {
    id:                 pago.id,
    estado:             pago.status,             // "approved" | "rejected" | "pending"
    estado_detalle:     pago.status_detail,
    external_reference: pago.external_reference, // ordenId
    monto:              pago.transaction_amount,
    metodo_pago:        pago.payment_type_id,
    fecha_aprobacion:   pago.date_approved,
  };
}
