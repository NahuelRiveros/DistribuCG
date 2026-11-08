# Módulo: carrito (`CAR`)

## Objetivo

Que cualquiera, con cuenta o sin ella, arme su pedido rápido y sin perder lo que eligió: ni al
ingresar, ni al tocar cantidades seguido, ni si se corta la conexión.

## Alcance

- **Incluye:** carrito de visitante y de cuenta, unirlos al ingresar, cantidades y bultos, límites.
- **No incluye:** enviar el pedido ([pedidos.md](pedidos.md)) ni qué precio se muestra ([precios.md](precios.md)).
- **Parte del core:** el carrito genérico (`controls/carrito/`: guardado en el navegador, unión, alertas)
  sirve para cualquier rubro; la distribuidora lo conecta a su API.

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Visitante | Armar un carrito en su navegador (si la instalación lo permite). |
| Cliente | Su carrito guardado en la cuenta, el mismo en cualquier dispositivo. |

## Reglas

| Código | Regla | Estado |
| --- | --- | --- |
| CAR-01 | Un visitante puede ver el catálogo y armar un carrito sin cuenta. Se guarda en ese navegador hasta 30 días. | ✅ `storefront.spec.js` › "catálogo público, paginación y carrito visibles" (los 30 días: ⚠️) |
| CAR-02 | Al ingresar o registrarse, el carrito del visitante se une al de la cuenta. Unir dos veces lo mismo no duplica cantidades. | ✅ `checkout.integration.mjs` › "fusionar dos veces la misma selección no duplica cantidades"; `storefront.spec.js` › "el cliente conserva carrito al registrarse…" |
| CAR-03 | Las cantidades son enteras, de 1 a 9999, y nunca más que el stock disponible: "Solo quedan N unidades disponibles." | ✅ `checkout.integration.mjs` › "rechaza cantidades no enteras y stock insuficiente"; `ux_rules.test.mjs` › "carrito invitado combina variantes sin superar stock…" |
| CAR-04 | Un carrito admite hasta 200 renglones. | ⚠️ sin test |
| CAR-05 | Un carrito guardado dañado en el navegador se descarta sin romper la página. | ✅ `ux_rules.test.mjs` › "carrito invitado combina variantes sin superar stock y descarta almacenamiento corrupto" |
| CAR-06 | Los cambios rápidos de cantidad se ven al instante y se guardan agrupados; si el guardado falla, vuelve al valor guardado. Gana el último cambio, y quitar un renglón cancela su cambio pendiente. | ✅ `storefront.spec.js` › "cantidades rápidas en varias líneas conservan el último cambio"; "cantidad rechazada vuelve al valor guardado…" |
| CAR-07 | Antes de revisar el pedido se espera a que terminen de guardarse los cambios del carrito. | ⚠️ sin test |
| CAR-08 | Los cambios del carrito y el envío del pedido se hacen de a uno, aunque haya varios servidores: un cambio no se mezcla con un envío en curso. | ✅ `checkout.integration.mjs` › "un cambio concurrente se serializa con el envío" |
| CAR-09 | En una presentación con caja, se puede sumar de a una caja y se muestra la equivalencia en bultos ("1 caja + 3 paquetes"). | ✅ `storefront.spec.js` › "catálogo: presentación con caja, +1 caja y equivalencia en bultos" |
| CAR-10 | En los productos con bulto, el cliente elige pedir por caja o por unidad. | 🚧 decidido con el cliente, falta programar (etapa 4 de [mejoras-relevamiento.md](../../mejoras-relevamiento.md)) |
| CAR-11 | Si algo del carrito cambió (precio, stock, presentación que ya no existe), el carrito lo avisa. | ⚠️ sin test |
| CAR-12 | El carrito de visitante no se comparte entre dispositivos ni conviene editarlo en varias pestañas a la vez: es una limitación conocida, no un error. | ⚠️ sin test (limitación documentada) |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Catálogo público y carrito de visitante | `client_config.js` › `distribuidora.publicCatalog` / `guestCart` | Sí / Sí |
| Cantidad máxima por renglón | `client_config.js` › `distribuidora.maxQuantity` | 9999 |
| Renglones por carrito | `client_config.js` › `distribuidora.maxCartLines` | 200 |
| Días que se guarda el carrito de visitante | `client_config.js` › `distribuidora.cartTtlDays` | 30 |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/routes/carrito_distribuidora_router.js` →
  `services/carrito_distribuidora_service.js` y `cart_transaction.js`; reglas en `services/common/cart_rules.js`.
- Frontend: `controls/carrito/` (genérico: `use_persistent_cart.js`, `guest_storage.js`, alertas) y
  `modules/eccomerce_distribuidora/carrito/carrito_context.jsx`.

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-10 | CAR-10 | En productos con bulto, el cliente elige por caja o por unidad (relevamiento, punto 5). | Cliente |

## Preguntas abiertas

Ninguna.
