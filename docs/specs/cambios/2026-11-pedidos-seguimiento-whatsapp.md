# Cambio: avisar por WhatsApp, detalle del pedido del cliente y pestañas por estado

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-12 | [eccomerce_distribuidora/pedidos.md](../eccomerce_distribuidora/pedidos.md) |

## Por qué

Se replica lo que funcionó en la gestión de pedidos de Stilos (spec `2026-11-seguimiento-y-avisos.md` de ese
proyecto): el equipo hoy solo puede avisarle al cliente por mail; el cliente ve todos sus pedidos en una lista
larga, sin saber en qué paso va ni qué sigue; y en el panel el estado se elige en un desplegable.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PED-75 | **Avisar por WhatsApp.** En el detalle de cada pedido del panel, "Avisarle por WhatsApp" abre el chat con el celular del cliente y un mensaje según el estado (ej. "¡Hola Ana! Te escribimos de DC Formosa por tu pedido #12: lo estamos preparando.") con el link a su pedido. Lo manda la persona del equipo. Sin celular cargado, el botón no aparece y se avisa. | ✅ |
| PED-76 | **Detalle del pedido del cliente.** `/distribuidora/mis-pedidos/:id` muestra los pasos (Recibido → Confirmado → En preparación → Entregado), qué sigue, los artículos y la entrega, el cobro con los comprobantes, cancelar mientras está Recibido e historial (de los motivos, solo el de la cancelación). "Consultar por WhatsApp" aparece si la distribuidora cargó su número. Se actualiza al volver a la pestaña. La lista de "Mis pedidos" queda como resumen y lleva a cada detalle. Un pedido ajeno responde igual que uno que no existe. | ✅ |
| PED-77 | **Pestañas por estado en el panel.** Arriba de la lista: Todos, Recibidos, Confirmados, En preparación, Entregados y Cancelados (en la URL, como el resto de los filtros). La búsqueda acepta también el celular. Se mantienen los filtros de cobro, comprobante y cliente y la actualización cada 30 s. | ✅ |

**Fuera de alcance (decidido el 2026-11-12):** link de seguimiento sin cuenta (acá todo pedido tiene cuenta),
filtrar los mails a los cambios importantes, cambiar la actualización automática del panel, retiro o envío (PED-08).

## Diseño

- **API:** `GET /api/distribuidora/notas-pedido/:id` (cliente con sesión, solo los suyos): pedido con artículos,
  cobros, comprobantes e historial. `GET /todas` busca también por `persona.celular`; un número largo ya no se
  interpreta como número de pedido (no entra en un entero).
- **Base de datos:** sin cambios.
- **Pantallas:** botón en `pedidos/nota_pedido_card.jsx`; página nueva `carrito/mi_pedido_page.jsx`; pestañas en
  `pedidos/notas_pedido_page.jsx`. Textos por estado en una función pura (`pedidos/controles/mensajes_estado.js`),
  probada en `servidor/tests/ux_rules.test.mjs`. Carga, error con reintentar y vacío; pensado para celular.
- **Configuración:** `proyecto/client_config.js` → `whatsapp: null` (`[COMPLETAR]` con el número de la distribuidora,
  con código de país y sin "+", ej. `5493704000000`). Mientras sea null no se ofrece "Consultar por WhatsApp".

## Tareas

1. [x] Servidor: detalle propio y búsqueda por celular (tests de integración).
2. [x] Frontend: mensajes por estado (tests de la función), botón del panel, detalle del cliente, pestañas.
3. [x] Playwright de las tres pantallas.
4. [x] `node scripts/verificar.mjs --completo` en verde y capturas en escritorio y celular.
5. [x] Pasar las reglas a la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Celulares mal cargados:** el link de WhatsApp toma solo los dígitos y antepone 549 si no empieza con 54; un
  número incompleto abre un chat equivocado. El equipo ve el número antes de mandar.

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-11-12 | PED-75 a PED-77 | Replicar de Stilos el aviso por WhatsApp, el detalle del pedido del cliente y las pestañas por estado. Los mails y la actualización cada 30 s quedan como están. | Dueño del proyecto |
