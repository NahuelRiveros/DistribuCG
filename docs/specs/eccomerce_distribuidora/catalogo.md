# Módulo: catálogo (`CAT`)

## Objetivo

Que el cliente encuentre rápido lo que busca, ordenado como en un mayorista, y que el equipo cargue y
mantenga cientos de artículos sin errores, a mano o importando una planilla.

## Alcance

- **Incluye:** familias y categorías, marcas, artículos y presentaciones, bultos y stock, el catálogo que ve
  el cliente, la importación y el catálogo inicial.
- **No incluye:** los precios ([precios.md](precios.md)) ni el carrito ([carrito.md](carrito.md)).

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Visitante y cliente | Buscar, filtrar y ver artículos. |
| Rol con "Editar artículos y stock" | Artículos, familias, categorías, marcas y stock. |
| Rol con "Editar artículos" **y** "Cambiar precios" | Importar productos. |

## Reglas

### Familias y categorías

| Código | Regla | Estado |
| --- | --- | --- |
| CAT-01 | El catálogo tiene dos niveles: Familia › Categoría. Una planilla con más niveles se aplana a dos al importar. | ✅ `checkout.integration.mjs` › "familias y categorías: dos niveles, mover en lote y fusionar sin perder artículos"; `ux_rules.test.mjs` › "familias y categorías: la importación aplana a dos niveles…" |
| CAT-02 | Se pueden mover categorías en lote y fusionar dos sin perder artículos. | ✅ mismo test que CAT-01; `storefront.spec.js` › "familias y categorías: dos columnas, búsqueda global, alta y fusión" |
| CAT-03 | Borrar una familia o categoría es darla de baja: no se reactiva sola al arrancar. | ✅ `seed_distribuidora.test.mjs` › "seed: respeta bajas de familias y categorías sin reactivarlas" |

### Marcas

| Código | Regla | Estado |
| --- | --- | --- |
| CAT-10 | Las marcas se ofrecen por familia o categoría. En la ficha se elige entre las de su categoría, sin duplicar, y se puede crear una en el momento. | ✅ `storefront.spec.js` › "marca en la ficha: lista de su categoría, sin duplicar y alta en el momento" |
| CAT-11 | La lista de marcas muestra dónde se ofrece cada una y permite unificar las repetidas. | ✅ `storefront.spec.js` › "marcas: lista con dónde se ofrece, unificar y alta en página propia" |
| CAT-12 | Las marcas viejas escritas como texto pasan solas a la lista de marcas al arrancar, uniendo las repetidas. | ✅ `checkout.integration.mjs` › "marcas: datos viejos migran a la tabla, se ofrecen por familia o categoría y se unifican" |

### Artículos y presentaciones

| Código | Regla | Estado |
| --- | --- | --- |
| CAT-20 | Un artículo tiene una o más presentaciones, cada una con precio, IVA, stock, unidad, código interno y código de barras. La ficha valida todos esos datos. | ✅ `ux_rules.test.mjs` › "ficha del artículo valida precio, IVA, stock, unidades y código de barras" |
| CAT-21 | El código de barras se limpia de espacios y tiene de 6 a 14 números. | ✅ `ux_rules.test.mjs` › "importación: el código de barras se limpia de espacios y se valida (6 a 14 números)" |
| CAT-22 | Una presentación puede venir en bultos (de 1 a 10.000 unidades por bulto). Las cantidades se muestran en bultos y sueltos: 23 paquetes en cajas de 20 son "1 caja + 3 paquetes". | ✅ `ux_rules.test.mjs` › "bultos y sueltos: 23 paquetes en cajas de 20 son 1 caja + 3 paquetes" |
| CAT-23 | Cada presentación decide si controla stock. La gestión destaca el stock bajo el mínimo y filtra sin stock o bajo mínimo. | ✅ `storefront.spec.js` › "artículos: tabla con código, bultos y stock bajo; filtros en la dirección; ficha con pestañas" |
| CAT-24 | Los nombres se escriben con mayúscula en cada palabra, sin romper códigos, unidades ni palabras cortas. | ✅ `ux_rules.test.mjs` › "nombres del catálogo: mayúscula por palabra sin romper códigos, unidades ni palabras cortas" |
| CAT-25 | Las fotos del cliente se asignan por código interno solo a los artículos vigentes sin foto, y solo se aceptan direcciones HTTPS de Cloudinary. | ✅ `imagenes_catalogo.test.mjs` (3 tests "fotos del catálogo: …") |

### Lo que ve el cliente

| Código | Regla | Estado |
| --- | --- | --- |
| CAT-30 | El catálogo se ve por páginas de 24 artículos y se busca por producto, marca o código, en cualquier parte del nombre. | ✅ `storefront.spec.js` › "catálogo público, paginación y carrito visibles"; `checkout.integration.mjs` › "índice de búsqueda se crea aunque pg_trgm esté instalada en otro schema" |
| CAT-31 | Si falla la conexión, se ofrece reintentar: nunca se muestra un catálogo vacío como si no hubiera productos. | ✅ `storefront.spec.js` › "una falla de red muestra reintento y nunca catálogo vacío" |
| CAT-32 | El home comercial muestra categorías, búsqueda y acceso a promociones; sin productos mantiene la navegación y el contacto, y si falla permite reintentar. | ✅ `storefront.spec.js` › "home comercial: …" (3 tests) |

### Importación

| Código | Regla | Estado |
| --- | --- | --- |
| CAT-40 | Se importa un Excel o CSV de hasta 20 MB y 50.000 filas. Las columnas se reconocen por su nombre; se elige crear nuevos, actualizar existentes o las dos cosas, y se ve una muestra antes de confirmar y un informe al terminar. | ⚠️ sin test |
| CAT-41 | En artículos existentes, el código de barras y los bultos solo se completan si estaban vacíos, y el stock solo se reemplaza si se habilita "Actualizar stock". | ⚠️ sin test |
| CAT-42 | Importar pide "Editar artículos" y "Cambiar precios", porque también escribe precios. | ✅ `ux_rules.test.mjs` › "permisos: admin y super admin tienen todo…" (ver PER-03) |

### Catálogo inicial

| Código | Regla | Estado |
| --- | --- | --- |
| CAT-50 | El catálogo inicial completa una base sin pisar lo que el cliente cambió: respeta bajas, renombres, IDs y nombres, no duplica y omite lo que no encuentra sin frenar la carga. | ✅ `seed_distribuidora.test.mjs` (15 tests "seed: …" y "productos: …") |
| CAT-51 | El catálogo de demostración se retira dándolo de baja, y conserva los artículos que tienen código del cliente; sin confirmar, solo cuenta. | ✅ `imagenes_catalogo.test.mjs` › "retiro del catálogo demo: …" (2 tests) |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Artículos por página | `client_config.js` › `distribuidora.pageSize` | 24 |
| Unidades de venta y bultos | `unidades_config.js` | 16 unidades · hasta 10.000 por bulto |
| Límites y columnas de la importación | `catalog_import_config.js` | 20 MB · 50.000 filas |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/services/catalogos_distribuidora_service.js`,
  `marcas_distribuidora_service.js`, `producto_distribuidora_service.js`, `articulo_rules.js`,
  `importacion_distribuidora_service.js` e `importacion/`; seeds en `modulos/eccomerce_distribuidora/seed/`.
- Frontend: `modules/eccomerce_distribuidora/productos/` (lo que ve el cliente) y `admin/` (gestión e importación).

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |

## Preguntas abiertas

Ninguna.
