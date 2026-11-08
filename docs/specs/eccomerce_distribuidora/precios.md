# Módulo: precios (`PRE`)

## Objetivo

Que cada cliente vea y pague el precio que le corresponde según su zona, siempre el mismo en el
catálogo, el carrito y el pedido, y que solo quien está autorizado pueda cambiarlo.

## Alcance

- **Incluye:** el precio General de cada presentación, las ofertas, las listas regionales por localidad,
  el ajuste masivo y quién puede cambiar precios.
- **No incluye:** la carga del artículo ([catalogo.md](catalogo.md)) ni la revisión de precios al enviar
  ([pedidos.md](pedidos.md), PED-01).

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Visitante | Ver los precios Generales (catálogo público). |
| Cliente | Ver y pagar los de la lista de su localidad, o la General si no tiene. |
| Rol con "Cambiar precios" | Precios de la ficha, ajuste masivo, listas de precios e importación. |

## Reglas

### Precio General y ofertas

| Código | Regla | Estado |
| --- | --- | --- |
| PRE-01 | Cada presentación tiene un precio **General** y, opcional, un precio anterior. Los precios guardados son finales: ya incluyen IVA. | ✅ `ux_rules.test.mjs` › "ficha del artículo valida precio, IVA, stock, unidades y código de barras" |
| PRE-02 | Hay oferta cuando el precio anterior es mayor que el precio de su lista. Las ofertas aparecen en el carrusel del home y en un filtro del catálogo. | ✅ `storefront.spec.js` › "ofertas: carrusel en el home con precios de la zona y filtro en el catálogo" |
| PRE-03 | Se guarda la fecha del último cambio de precio de cada artículo. | ✅ `checkout.integration.mjs` › "artículos: ficha con bultos, filtros de gestión y fecha de cambio de precio" |

### Listas regionales

| Código | Regla | Estado |
| --- | --- | --- |
| PRE-10 | Una lista guarda solo las excepciones a la General, por presentación, y se aplica según la localidad del perfil del cliente. | ✅ `checkout.integration.mjs` › "listas de precios: la localidad del cliente define el precio del carrito y del pedido; ofertas por lista" |
| PRE-11 | Una localidad pertenece a una sola lista. | ✅ mismo test que PRE-10 |
| PRE-12 | Sin sesión, sin lista para su localidad o con la lista pausada, se usa la General. | ✅ mismo test que PRE-10 |
| PRE-13 | El catálogo, el detalle, las ofertas, el carrito y el pedido usan la misma regla: el cliente nunca ve un precio y paga otro. | ✅ mismo test que PRE-10 |
| PRE-14 | La gestión ve siempre el precio General. | ⚠️ sin test |
| PRE-15 | El nombre de una lista tiene hasta 80 caracteres y no se repite; una lista admite hasta 2000 localidades. | ⚠️ sin test |
| PRE-16 | Los precios de una lista se pueden importar por código; si algún código no existe, no se guarda nada y se informan los que faltan. | ✅ mismo test que PRE-10 |

### Cambiar precios

| Código | Regla | Estado |
| --- | --- | --- |
| PRE-20 | El ajuste masivo sube o baja un porcentaje los precios de un artículo, de una categoría o de todo el catálogo (este último pide una confirmación aparte). No toca el precio anterior. | ⚠️ sin test |
| PRE-21 | Quien no tiene "Cambiar precios" puede guardar la ficha, pero el servidor rechaza cualquier cambio de precio; un artículo nuevo se crea en $0, y no ve ajustes, listas ni importación. | ✅ `storefront.spec.js` › "rol sin permiso de precios: carga artículos en $0 y no ve ajustes, listas ni importación"; `checkout.integration.mjs` › "permisos: … precios protegidos" |
| PRE-22 | Los precios de demostración solo se cargan fuera de producción: fijos por producto, dentro del rango de su familia y con alrededor del 20 % en oferta. | ✅ `ux_rules.test.mjs` › "precios de demostración: …nunca en producción"; `checkout.integration.mjs` › "precios de demostración…" |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Precio General y anterior | Cada presentación (`variedad_distribuidora`) | — |
| Listas y sus localidades | `/distribuidora/admin/listas-precio` | — |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/services/listas_precio_service.js` (todo precio que ve o paga
  un cliente pasa por acá) y `producto_distribuidora_service.js` (ficha y ajuste masivo); rutas en
  `routes/listas_precio_router.js` y `producto_distribuidora_router.js`.
- Frontend: `modules/eccomerce_distribuidora/admin/` (listas, ficha, precios en listas).

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-11-08 | PRE-12 | Los precios se ven sin registrarse (como hoy). | Cliente |
| 2026-11-08 | — | Las cuentas nuevas no necesitan aprobación (como hoy, USU-10). | Cliente |
| 2026-11-08 | PRE-10 | Los precios distintos por localidad se resuelven con las listas regionales que ya existen: el cliente de esa localidad ve el precio de su lista en el catálogo, el carrito y el pedido. | Cliente |
| 2026-11-08 | — | No hay listas de precios por cliente. Lo que se necesita es un listado de clientes con datos completos: ver [clientes.md](clientes.md) (CLI-11). | Cliente |

## Preguntas abiertas

Ninguna.
