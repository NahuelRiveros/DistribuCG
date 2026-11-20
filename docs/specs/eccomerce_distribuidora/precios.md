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

### Actualizar precios con la lista del cliente

En el panel, "Actualizar precios" recibe el Excel que exporta el sistema del cliente ([cambio](../cambios/2026-11-actualizar-precios-lista-cliente.md)).
Los tests de integración y de navegador cubren las reglas juntas: `checkout.integration.mjs` › "PRE-30 a PRE-39: …" y
`storefront.spec.js` › "PRE-30 a PRE-39: …" y "PRE-30: si el Excel no es la lista…".

| Código | Regla | Estado |
| --- | --- | --- |
| PRE-30 | Recibe el Excel (.xlsx, hasta 20 MB) y lee la hoja `LISTA`; sin esa hoja avisa cuáles encontró y no sigue. Pide solo "Cambiar precios". | ✅ `precios_cliente.test.mjs` › "PRE-30: …"; integración; `storefront.spec.js` |
| PRE-31 | Busca grupos código · descripción · precio en cada fila (la hoja trae dos por fila) y saltea títulos. El código, de 6 cifras y como texto, se limpia de espacios, comillas y apóstrofes sin perder los ceros de adelante. Un precio vacío, con espacios o con texto vale 0. Se redondea al centavo. | ✅ `precios_cliente.test.mjs` › "PRE-31: …" |
| PRE-32 | Empareja por código interno (`cod_ref`) y solo cambia el precio General: no toca nombre, foto, categoría, stock, IVA ni el precio anterior, y no resta IVA. | ✅ `precios_cliente.test.mjs` › "PRE-32 y PRE-35: …" |
| PRE-33 | Si `Datos Exportados` trae un precio mayor, vale ese (la fila lo indica). Solo entre precios mayores que 0, y no si el código está repetido allá con precios distintos. | ✅ `precios_cliente.test.mjs` › "PRE-33: …" |
| PRE-34 | Un precio 0 en la lista (dejó de venderse) no toca el precio; se avisa cuántos son y cada presentación guarda desde cuándo está en 0. La fecha se borra cuando vuelve con precio. | ✅ `precios_cliente.test.mjs` › "PRE-34 y PRE-34b: …"; integración |
| PRE-34b | Con más de 6 meses en 0 (todas las presentaciones del artículo) se desactiva sin tocar el precio. Si vuelve con precio, se reactiva. Activarlo o desactivarlo a mano saca esa marca y la lista ya no lo cambia sola. | ✅ `precios_cliente.test.mjs` › "PRE-34 y PRE-34b: …"; integración |
| PRE-35 | Antes de aplicar, la vista previa agrupa: código repetido, cambio extremo, a revisar, sube, baja, primer precio, vuelven a la venta, se desactivan, sin precio, sin cambio, no están en la tienda y no figuran en la lista. Cuando un precio baja no se marca oferta. | ✅ `precios_cliente.test.mjs` › "PRE-32 y PRE-35: …"; `storefront.spec.js` |
| PRE-36 | Va a revisar si varía más del 20 % o si el nombre no se parece al del artículo (menos del 40 % de las palabras de la lista). Se aprueban todas juntas o se excluyen de a una. Los extremos (más de +100 % o de −50 %) se aprueban de a uno. El primer precio de un artículo en $0 no se revisa. Lo que no se aprueba no se aplica. | ✅ `precios_cliente.test.mjs` › "PRE-36: …"; integración; `storefront.spec.js` |
| PRE-37 | Un código repetido en la lista con precios distintos no se aplica hasta que alguien elige cuál vale (se muestra cada opción con su descripción y fila) o lo excluye. Con precios iguales se toma una vez. | ✅ `precios_cliente.test.mjs` › "PRE-37: …"; integración; `storefront.spec.js` |
| PRE-38 | Al aplicar, la casilla "Ajustar también las listas regionales" (marcada por defecto) multiplica cada excepción regional por la misma proporción, redondeada al centavo. | ✅ integración; `storefront.spec.js` |
| PRE-39 | Se aplica por lotes, sin repetir uno ya aplicado. Lo que alguien cambió después de la vista previa no se pisa. Queda el informe (antes, después y decisión de cada código) y la última actualización se puede deshacer: vuelve solo lo que sigue como ella lo dejó. | ✅ integración; `storefront.spec.js` |

### Precio desde el costo y rentabilidad

[Cambio](../cambios/2026-11-costo-y-margen.md). Tests: `precio_desde_costo.test.mjs`, `checkout.integration.mjs` ›
"PRE-60 a PRE-70: …" y `storefront.spec.js` › "artículos: tabla con código…" y "marca en la ficha…".

| Código | Regla | Estado |
| --- | --- | --- |
| PRE-60 | Cada presentación puede guardar su costo neto (sin IVA ni ganancia) y su rentabilidad %, opcionales. | ✅ |
| PRE-61 | Precio = costo × (1 + rentabilidad) × (1 + IVA), en pesos enteros ($1.000 + 30 % + IVA 21 % = $1.573). Una sola regla (`rubros/eccomerce_distribuidora/precio_desde_costo.js`); el servidor recalcula. | ✅ |
| PRE-62 | La ficha pide precio neto (costo), rentabilidad % e IVA y calcula el precio final (lo que ve el cliente) con el desglose y la ganancia por unidad. Sin precio neto, el precio final se escribe a mano. Un artículo con costo cuyo precio puso la lista queda como está hasta que se cambie el neto, la rentabilidad o el IVA. | ✅ |
| PRE-63 | Con precio final a mano, el costo queda y la rentabilidad se recalcula con el precio. | ✅ |
| PRE-64 | El ajuste masivo aplica el porcentaje al costo neto y mantiene la rentabilidad; sin costo, al precio final. Por eso nunca deja un precio por debajo del costo. | ✅ |
| PRE-65 | Actualizar precios con la lista del cliente no toca el costo y recalcula la rentabilidad (también al deshacer). | ✅ |
| PRE-66 | La importación acepta "Costo neto" y "Rentabilidad %": con las dos, el precio se calcula; sin rentabilidad, la columna Precio es el precio final. | ✅ |
| PRE-67 | Un precio que no cubre el costo con IVA se avisa en rojo sin frenar: en la ficha, en la revisión de Actualizar precios (fila marcada y total) y en la importación (filas con aviso). | ✅ |
| PRE-68 | Al agregar otra presentación a un artículo se propone la rentabilidad de la que ya tiene. | ⏸ La ficha maneja una presentación por artículo: se hace cuando haya varias en la ficha. |
| PRE-69 | Costo mayor a 0 y hasta $99.999.999; rentabilidad de 0 % a 1.000 % (2 decimales); en "Desde el costo" van los dos. | ✅ |
| PRE-70 | Costo y rentabilidad solo los ve y cambia quien tiene "Cambiar precios"; la tienda, el carrito y los pedidos nunca los devuelven. El respaldo los incluye solo para ese permiso. | ✅ |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Precio General y anterior | Cada presentación (`variedad_distribuidora`) | — |
| Listas y sus localidades | `/distribuidora/admin/listas-precio` | — |
| Hojas, umbrales y plazo de la lista del cliente | `rubros/eccomerce_distribuidora/lista_precios_cliente_config.js` | `LISTA` vs `Datos Exportados` · revisar > 20 % · extremos +100 % / −50 % · nombre < 40 % · 6 meses sin precio |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/services/listas_precio_service.js` (todo precio que ve o paga
  un cliente pasa por acá) y `producto_distribuidora_service.js` (ficha y ajuste masivo); rutas en
  `routes/listas_precio_router.js` y `producto_distribuidora_router.js`. La lista del cliente:
  `services/precios_cliente_service.js` (aplicar, deshacer, informe) e `importacion/lista_cliente.js` (lectura y plan, sin base),
  ruta `/api/distribuidora/precios-cliente`.
- Frontend: `modules/eccomerce_distribuidora/admin/` (listas, ficha, precios en listas y `precios_cliente_page.jsx`).

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-11-08 | PRE-12 | Los precios se ven sin registrarse (como hoy). | Cliente |
| 2026-11-08 | — | Las cuentas nuevas no necesitan aprobación (como hoy, USU-10). | Cliente |
| 2026-11-08 | PRE-10 | Los precios distintos por localidad se resuelven con las listas regionales que ya existen: el cliente de esa localidad ve el precio de su lista en el catálogo, el carrito y el pedido. | Cliente |
| 2026-11-08 | — | No hay listas de precios por cliente. Lo que se necesita es un listado de clientes con datos completos: ver [clientes.md](clientes.md) (CLI-11). | Cliente |
| 2026-11-19 | PRE-30 a PRE-39 | Los precios se actualizan subiendo el Excel del cliente (hoja `LISTA`, comparada con `Datos Exportados`: gana el mayor). Un precio 0 no se toca, y si sigue en 0 más de 6 meses el artículo se desactiva hasta que vuelva con precio. Cuando un precio baja no se marca oferta. Las listas regionales se ajustan en el mismo porcentaje. Ver [cambio](../cambios/2026-11-actualizar-precios-lista-cliente.md). | Dueño del proyecto |
| 2026-11-20 | PRE-60 a PRE-70 | Precio desde el costo neto, la rentabilidad (sobre el costo) y el IVA, en pesos enteros; el ajuste masivo va al costo; la lista del cliente y el precio a mano recalculan la rentabilidad; avisos de precio por debajo del costo ([cambio](../cambios/2026-11-costo-y-margen.md)). | Dueño del proyecto |
| 2026-11-19 | PRE-40 a PRE-50 (en borrador) | Cada artículo tiene su propio descuento por bulto (escalas en su ficha, con copia a varios artículos para las promos de una marca), en tablas propias. "Bulto" es la palabra única para caja, paquete o display. Se cuentan por presentación, las sueltas pagan precio de lista, se suman a la oferta y la escala negociable se aplica con "consultá". Ver [cambio](../cambios/2026-11-descuentos-por-bulto.md). | Dueño del proyecto |

## Preguntas abiertas

Ninguna.
