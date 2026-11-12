# Módulo: notas de pedido (`PED`)

## Objetivo

Que el cliente mande su pedido sin sorpresas (precios y cantidades revisados al enviar) y que el
equipo lo lleve de "Recibido" a "Entregado" sin perder nada en el camino: stock, historial y avisos.

## Alcance

- **Incluye:** enviar el pedido, sus estados, el stock que se descuenta, lo que puede hacer el comprador,
  la gestión del equipo, la exportación, la lista de carga, los avisos por correo y el resumen del inicio del panel.
- **No incluye:** armar el carrito ([carrito.md](carrito.md)), los cobros y comprobantes ([cobros.md](cobros.md)),
  qué precio ve cada cliente ([precios.md](precios.md)), ni ingresar al sistema ([../core/usuarios.md](../core/usuarios.md)).
- **Fuente:** [docs/distribuidora-pedidos.md](../../distribuidora-pedidos.md) (el contrato técnico detallado).

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Cliente | Enviar pedidos, verlos en "Mis pedidos", cancelarlos mientras estén en Recibido. |
| Rol con "Ver pedidos" | Ver todas las notas, buscar, filtrar, armar la lista de carga. |
| Rol con "Cambiar estados" | Confirmar, preparar, entregar, cancelar o reabrir. |

## Estados

| Estado | Puede pasar a | Pide motivo | Descuenta stock |
| --- | --- | --- | --- |
| Recibido | Confirmado · Cancelado | Al cancelar | No |
| Confirmado | En preparación · Recibido · Cancelado | Al volver o cancelar | **Sí** (al entrar) |
| En preparación | Entregado · Confirmado · Cancelado | Al volver o cancelar | Sí |
| Entregado | En preparación | Al volver | Sí |
| Cancelado | Recibido (reabrir) | Al reabrir | No (devuelve) |

## Reglas

### Enviar el pedido

| Código | Regla | Estado |
| --- | --- | --- |
| PED-01 | Al enviar, el servidor vuelve a revisar disponibilidad, precios y cantidades. Si un precio cambió, no crea el pedido ni vacía el carrito, y avisa qué cambió. | ✅ `checkout.integration.mjs` › "precio cambiado no genera pedido ni vacía el carrito"; `ux_rules.test.mjs` › "stock, enteros y snapshot protegen el envío ante datos obsoletos" |
| PED-02 | Crear el pedido y vaciar el carrito pasan juntos: o pasan las dos cosas o ninguna. | ✅ `checkout.integration.mjs` › "envíos concurrentes y reintentos crean un único pedido" |
| PED-03 | Reintentos y envíos simultáneos crean un solo pedido. Si la respuesta no llegó, "Consultar o reintentar envío" recupera el mismo pedido desde ese navegador. | ✅ `checkout.integration.mjs` › "envíos concurrentes y reintentos crean un único pedido"; "un cambio concurrente se serializa con el envío" |
| PED-04 | El pedido guarda una copia de productos, precios, IVA de cada línea y datos de entrega: no cambia aunque después se edite el producto o el perfil del cliente. | ⚠️ sin test |
| PED-05 | En el primer pedido se piden nombre, apellido, celular, datos fiscales y de entrega; un cliente al que le faltan los completa sin perder el carrito. | ✅ `ux_rules.test.mjs` › "primer pedido exige nombre, apellido, celular, datos fiscales y de entrega"; `checkout.integration.mjs` › "cliente de antes sin condición de IVA…" |
| PED-06 | Enviar el pedido no reserva stock ni cobra nada: el equipo confirma disponibilidad, entrega y forma de pago. | ⚠️ sin test |
| PED-07 | Un pedido menor al monto mínimo no se puede enviar, y se muestra cuánto falta. El mínimo se calcula con los precios de la lista del cliente. | 🚧 decidido con el cliente, falta programar (etapa 4 de [mejoras-relevamiento.md](../../mejoras-relevamiento.md)) · ❓ ver pregunta 1 |
| PED-08 | El cliente elige reparto o retiro en el local. El costo de envío sale de su localidad; si la localidad no tiene monto, dice "a convenir" y el equipo lo carga al confirmar. | 🚧 decidido con el cliente, falta programar (etapa 4) |

### Estados y gestión

| Código | Regla | Estado |
| --- | --- | --- |
| PED-10 | Los cambios de estado son solo los de la tabla "Estados": no se salta de Recibido a En preparación. | ✅ `ux_rules.test.mjs` › "pedido: se confirma antes de preparar, retroceder pide motivo…"; `checkout.integration.mjs` › "gestión: transiciones, auditoría y cobro independiente" |
| PED-11 | Volver atrás, cancelar o reabrir pide un motivo (3 caracteres como mínimo). | ✅ `ux_rules.test.mjs` › mismo test que PED-10 |
| PED-12 | Cada cambio queda en el historial del pedido: estado anterior y nuevo, fecha, quién y motivo. | ✅ `checkout.integration.mjs` › "gestión: transiciones, auditoría y cobro independiente" |
| PED-13 | Si dos personas cambian el mismo pedido a la vez, se verifica el estado que vio cada una: la segunda recibe un aviso en vez de pisar el cambio. | ✅ `checkout.integration.mjs` › mismo test que PED-12 |
| PED-14 | Se puede preparar y entregar un pedido sin cobrar (a cuenta). | ✅ `checkout.integration.mjs` › mismo test que PED-12 |
| PED-15 | La gestión muestra hasta 50 notas por página, busca por número, nombre, apellido o email y filtra por estado y por cobro. | ✅ `storefront.spec.js` › "staff gestiona notas y registra cobros con historial en cualquier pantalla" |
| PED-16 | La lista de la gestión se actualiza sola cada 30 segundos y al terminar cada acción. | ⚠️ sin test |
| PED-17 | Ver pide "Ver pedidos" y cambiar estados, "Cambiar estados"; el servidor lo controla en cada acción. | ✅ `checkout.integration.mjs` › "HTTP: cliente no gestiona notas y el supervisor sí, con sus permisos" |
| PED-18 | Cada pedido se puede bajar como planilla de Excel con cliente, CUIT o DNI, condición frente al IVA y factura sugerida, entrega, fecha y detalle. Pide "Ver pedidos". | ⚠️ sin test |
| PED-19 | Cada pedido muestra un botón principal con el próximo paso ("Confirmar pedido", "Empezar preparación", "Marcar como entregado"); "Cancelar pedido" va aparte, en rojo, y volver atrás o reabrir, en "Más opciones". | ✅ `ux_rules.test.mjs` › "PED-19: cada estado tiene un botón principal…"; `storefront.spec.js` › "staff gestiona notas y registra cobros…" |

### Stock

| Código | Regla | Estado |
| --- | --- | --- |
| PED-20 | Al pasar a Confirmado se descuenta el stock de las presentaciones que controlan stock. Si no alcanza, la confirmación se rechaza diciendo qué falta. | ✅ `checkout.integration.mjs` › "stock: confirmar descuenta, sin stock no confirma y los pedidos viejos no devuelven" |
| PED-21 | El stock vuelve si el pedido sale de los estados que lo descuentan (vuelve a Recibido o se cancela). | ✅ mismo test que PED-20 |
| PED-22 | Los pedidos de antes de este sistema de stock no devuelven nada al cancelarse: nunca descontaron. | ✅ mismo test que PED-20 |
| PED-23 | Aceptar un comprobante que deja el pedido cobrado por completo lo pasa solo de Recibido o Confirmado a En preparación (confirma y descuenta stock en el mismo paso). Con un pago parcial, solo registra el cobro. | ✅ `checkout.integration.mjs` › "PED-23 a PED-25: aceptar el comprobante por el total pasa el pedido solo a En preparación…" |
| PED-24 | Si al aceptar el comprobante falta stock, el cobro se registra igual y el pedido no avanza, con el aviso de qué falta. | ✅ mismo test que PED-23; `storefront.spec.js` › "gestión revisa comprobantes…" (el aviso en pantalla) |
| PED-25 | El avance automático queda en el historial con el motivo "Pago aceptado" y al comprador le llega un solo correo. | ✅ mismo test que PED-23 (historial); el correo único: ⚠️ sin test |
| PED-26 | Los pedidos sin comprobante (efectivo o a cuenta) se confirman a mano con "Confirmar pedido". | ✅ `storefront.spec.js` › "staff gestiona notas y registra cobros…" ("Confirmar pedido" a mano) |

### Lo que hace el comprador

| Código | Regla | Estado |
| --- | --- | --- |
| PED-30 | En "Mis pedidos" ve el estado y el saldo de cada pedido, solo de los suyos. | ✅ `checkout.integration.mjs` › "comprador: cancela en Recibido, vuelve a armar una sola vez y no toca pedidos ajenos…" |
| PED-31 | Puede cancelar solo en Recibido, con un motivo, que queda en el historial como "Cancelado por el cliente: …". | ✅ mismo test que PED-30; `storefront.spec.js` › "comprador cancela un pedido recibido y lo vuelve a armar; el confirmado no se puede cancelar" |
| PED-32 | "Cancelar y volver a armar" devuelve los productos al carrito al precio de hoy y ajustados a lo disponible, avisa lo que no entró y se puede hacer una sola vez por pedido. | ✅ mismo test que PED-30 |
| PED-33 | No puede editar un pedido ya enviado: para cambiarlo, lo cancela y lo vuelve a armar. | ⚠️ sin test |

### Lista de carga

| Código | Regla | Estado |
| --- | --- | --- |
| PED-40 | Se eligen varios pedidos y se obtiene cuánto cargar de cada artículo, agrupado por familia y separado en bultos y sueltos, lista para imprimir. | ✅ `checkout.integration.mjs` › "lista de carga: suma varios pedidos por artículo, agrupa por familia y separa bultos"; `storefront.spec.js` › "lista de carga: elegir pedidos…" |
| PED-41 | Solo acepta números de pedido válidos y una cantidad limitada de pedidos por vez. | ✅ `ux_rules.test.mjs` › "lista de carga acepta ids de pedidos válidos y limita la cantidad" |

### Avisos por correo

| Código | Regla | Estado |
| --- | --- | --- |
| PED-50 | Pedido nuevo: aviso al equipo (activos con "Ver pedidos" o admin, sin repetir) y al comprador con el detalle. Cambio de estado: aviso al comprador. Cancelación del comprador: aviso al equipo con el motivo. | ✅ `checkout.integration.mjs` › "avisos: pedido nuevo al equipo y al comprador una sola vez; estados y cancelación; Brevo caído no frena el pedido" |
| PED-51 | Al comprador solo le llega el motivo cuando se cancela; los motivos de los otros cambios son internos. | ✅ mismo test que PED-50 |
| PED-52 | Un correo que falla no frena ni deshace el pedido; un reintento o un cambio al mismo estado no repite avisos. | ✅ mismo test que PED-50 |
| PED-53 | Lo que escribe el cliente se muestra escapado en los correos: no puede inyectar contenido. | ✅ `ux_rules.test.mjs` › "mails de pedidos: detalle, enlaces y texto del cliente escapado" |

### Resumen del inicio del panel

| Código | Regla | Estado |
| --- | --- | --- |
| PED-70 | El inicio del panel muestra los pedidos del día y del mes, contados en hora de Argentina (el servidor está en otra zona horaria). | ✅ `checkout.integration.mjs` › "panel: resumen por rol, ventas en hora de Argentina y presentaciones sin stock" |
| PED-71 | Los montos (ventas del día y del mes, saldo por cobrar) solo los ve quien tiene "Ver ventas y saldos"; el resto ve las cantidades de pedidos sin montos. El servidor no manda los montos a quien no tiene el permiso. | ✅ mismo test que PED-70 |
| PED-72 | Las ventas no cuentan los pedidos cancelados. | ✅ mismo test que PED-70 |
| PED-73 | Quien tiene "Editar artículos" ve cuántas presentaciones están sin stock o bajo el mínimo, con ejemplos y acceso directo a la lista filtrada. | ✅ mismo test que PED-70; `storefront.spec.js` › "artículos: tabla con código, bultos y stock bajo…" |
| PED-74 | Cada parte del resumen se muestra solo con su permiso: sin "Ver pedidos" ni "Ver ventas y saldos" no hay resumen de pedidos, y sin "Editar artículos" no hay resumen de stock. | ✅ mismo test que PED-70 |
| PED-75 | En el detalle de cada pedido del panel, "Avisarle por WhatsApp" abre el chat con el celular del cliente y un mensaje según el estado, con el link a su pedido; sin celular no aparece y se avisa ([cambio](../cambios/2026-11-pedidos-seguimiento-whatsapp.md)). | ✅ `ux_rules.test.mjs` › "PED-75 y PED-76…"; `storefront.spec.js` › "PED-75 y PED-77…" y "staff gestiona notas…" |
| PED-76 | El cliente ve cada pedido en `/distribuidora/mis-pedidos/:id`: pasos, qué sigue, artículos y entrega, cobro y comprobantes, cancelar mientras está Recibido e historial (de los motivos, solo el de la cancelación); "Consultar por WhatsApp" si `client_config.whatsapp` está cargado. Se actualiza al volver a la pestaña. La lista es un resumen. Uno ajeno responde como inexistente. | ✅ `checkout.integration.mjs` › "comprador: cancela en Recibido…"; `storefront.spec.js` › "comprador cancela…" y "comprador adjunta el comprobante…" |
| PED-77 | El panel de pedidos tiene pestañas por estado (en la URL) y busca también por celular; un número largo no se toma como número de pedido. | ✅ `checkout.integration.mjs` › "gestión: transiciones…"; `storefront.spec.js` › "PED-75 y PED-77…" |

### Facturación (preparada, no integrada)

| Código | Regla | Estado |
| --- | --- | --- |
| PED-60 | Cada línea guarda su alícuota de IVA; con eso se arma la factura con el IVA desglosado al centavo. Los precios guardados ya incluyen IVA. | ✅ `ux_rules.test.mjs` › "ARCA: arma la factura de un pedido con el IVA desglosado por alícuota, al centavo" |
| PED-61 | La gestión sugiere factura A, B o C según la condición frente al IVA del emisor y del cliente. | ✅ `ux_rules.test.mjs` › "fiscal: CUIT con dígito verificador, DNI y factura que corresponde…" |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Estados, transiciones, motivos y stock por estado | `order_config.js` | ver tabla "Estados" |
| Estados en que el comprador cancela | `order_config.js` › `buyerCancelableStates` | Recibido |
| Exigir un cobro antes de un estado | `order_config.js` › `paymentRequiredStates` | Ninguno (se entrega a cuenta) |
| Monto mínimo de compra | — (etapa 4) | $50.000 **provisorio** |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/routes/nota_pedido_router.js` → `controllers/nota_pedido_controller.js`
  → `services/nota_pedido_service.js`, `cart_transaction.js`, `lista_carga_service.js`, `avisos_pedido_service.js`
  y `avisos_pedido_plantillas.js`; reglas de estados en `order_config.js`.
- Frontend: `modules/eccomerce_distribuidora/carrito/` (nota de pedido y "Mis pedidos") y `pedidos/` (gestión y lista de carga).

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-10 | PED-07, PED-08 | Mínimo de compra con la lista del cliente; reparto o retiro con costo por localidad o "a convenir" (relevamiento, puntos 5 y 7). | Cliente |
| 2026-10 | PED-20 | El stock se descuenta al Confirmar, no al enviar (relevamiento, punto 8). | Cliente |
| 2026-10 | PED-31 | El comprador cancela solo en Recibido y no edita: "Cancelar y volver a armar" (relevamiento, punto 10). | Cliente |
| 2026-11-08 | PED-19, PED-23, PED-26 | Botón principal con el próximo paso; aceptar el comprobante por el total pasa el pedido solo a En preparación; sin comprobante se confirma a mano. Se mantienen los estados Confirmado y En preparación. Se descartaron dejar el estado sin cambios al aceptar, pasar solo a Confirmado, exigir cobro para confirmar y unir los dos estados. | Dueño del proyecto |

## Preguntas abiertas

1. **PED-07 — ¿El cliente confirmó el mínimo de $50.000?** En el relevamiento quedó como provisorio, y
   la etapa 4 (mínimo, reparto o retiro, costo por localidad) espera este dato para escribir su spec de
   cambio. Opciones: (a) confirmado en $50.000; (b) otro monto; (c) todavía no lo sabe.
   **Respuesta:** ⏳ Esperando al cliente (2026-11-08: todavía no lo sabe).
