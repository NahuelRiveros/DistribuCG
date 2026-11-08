# Cambio: estados del pedido más claros y confirmación al aceptar el pago

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-08 | [eccomerce_distribuidora/pedidos.md](../eccomerce_distribuidora/pedidos.md) |

## Por qué

- En cada pedido aparece un botón "Pasar a …" por cada cambio permitido, mezclando avanzar con volver
  atrás: con un pedido En preparación, "Pasar a confirmado" en realidad lo hace retroceder.
- Aceptar el comprobante solo registra el cobro: alguien tiene que acordarse después de confirmar el pedido.
- El cliente espera que, cuando se revisa su comprobante, su pedido avance solo y le llegue el aviso.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PED-19 | Cada pedido muestra **un botón principal** con el próximo paso: Recibido → "Confirmar pedido"; Confirmado → "Empezar preparación"; En preparación → "Marcar como entregado". "Cancelar pedido" va aparte, en rojo, y pide motivo. Volver un paso atrás o reabrir un cancelado van dentro de "Más opciones", con su nombre ("Volver a Recibido", "Reabrir pedido"). "Exportar Excel" pasa a ser secundario. | ✅ |
| PED-23 | Al **aceptar un comprobante** que deja el pedido **cobrado por completo**, si el pedido está en Recibido o Confirmado, pasa solo a **En preparación**: se confirma (descuenta stock, PED-20) y empieza la preparación en un solo paso. Con un pago parcial, solo se registra el cobro y el pedido no cambia. | ✅ |
| PED-24 | Si al aceptar el comprobante no alcanza el stock, el cobro se registra igual y el pedido se queda en su estado, con el aviso "Cobro registrado, pero no se pudo confirmar: falta stock de …". | ✅ |
| PED-25 | El paso automático queda en el historial como dos cambios (a Confirmado y a En preparación) con el motivo "Pago aceptado", a nombre de quien aceptó el comprobante; al comprador le llega **un solo correo**, el de En preparación. | ✅ |
| PED-26 | Los pedidos sin comprobante (efectivo al entregar o a cuenta) se siguen confirmando a mano con "Confirmar pedido". | ✅ |

**Se mantiene:** los cinco estados y sus pasos permitidos (tabla "Estados" de la spec), entregar a cuenta
(PED-14), el motivo obligatorio al volver o cancelar (PED-11) y el correo en cada cambio (PED-50).

**Fuera de alcance:** pasar a Entregado automáticamente, avisos por WhatsApp y cambiar los textos de los correos.

## Diseño

- **API:** sin rutas nuevas. `POST /notas-pedido/:id/comprobantes/:cid/aceptar` hace, en la misma transacción,
  el cobro (como hoy) y, si corresponde PED-23, los dos cambios de estado con el mismo lock y la misma
  verificación de stock que la confirmación manual. Responde además si el pedido avanzó o por qué no (PED-24).
- **Correos:** el aviso al comprador se manda después de confirmar la transacción, uno solo, con el estado final.
- **Pantallas:** `nota_pedido_card.jsx` arma los botones desde una tabla de "próximo paso" por estado, en vez
  de un botón por transición. En celular el botón principal ocupa todo el ancho; "Más opciones" se abre debajo.
- **Base de datos:** sin cambios.

## Tareas

1. [x] Tests (fallan al principio):
   - Servidor: comprobante por el total en Recibido → En preparación con stock descontado; en Confirmado → En
     preparación; pago parcial → sin cambio; sin stock → cobro registrado y pedido sin cambio, con el aviso;
     historial con dos cambios y un solo correo; reintento de aceptar no repite nada.
   - Navegador: botón principal correcto en cada estado; "Volver a …" solo en "Más opciones"; cancelar pide motivo.
2. [x] Servidor: `comprobantes_service.js` (aceptar y avanzar) usando las mismas reglas de `nota_pedido_service.js`.
3. [x] Frontend: botones de `nota_pedido_card.jsx` y el mensaje de PED-24.
4. [x] `node scripts/verificar.mjs --completo` en verde y revisión visual en escritorio y celular.
5. [x] Pasar PED-19 y PED-23 a PED-26 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Los correos no salen hoy:** en Render falta `CLAVE_API_BREVO` (y `CORREO_REMITENTE` verificado en Brevo).
  Sin eso el pedido avanza igual, pero al cliente no le llega ningún aviso. Configurarlo es un paso tuyo.
- **Quién puede hacer avanzar el pedido:** aceptar un comprobante pide "Registrar cobros"; el avance automático
  es parte de aceptar (ver pregunta 1).
- **Pedidos que hoy están en Confirmado:** no cambian; el botón nuevo les ofrece "Empezar preparación".

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-08 | No hay rol Cajero por ahora: acepta comprobantes quien gestiona las notas de pedido, así que el avance automático es parte de aceptar el pago (opción a). | Dueño del proyecto |

## Preguntas abiertas

Ninguna.
