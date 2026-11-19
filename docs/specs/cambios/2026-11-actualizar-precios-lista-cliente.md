# Cambio: actualizar precios con la lista del cliente

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-19 | [eccomerce_distribuidora/precios.md](../eccomerce_distribuidora/precios.md) |

## Por qué

La distribuidora cambia sus precios en su propio sistema de gestión y saca de ahí un Excel
("LISTA DE PRECIOS DC-FSA.xlsx"). Hoy, para que la tienda tenga esos precios, hay que convertir la planilla
con un script por fuera y subirla con la importación general, que no entiende ese formato. Se necesita que
alguien del equipo suba **ese mismo Excel** en el panel, vea qué precios cambian y los actualice, sin tocar
nada más del artículo.

### Cómo es el Excel (analizado el 2026-11-19)

| Hoja | Qué trae | Uso |
| --- | --- | --- |
| `LISTA` | La lista vigente: ~2.800 códigos en dos bloques lado a lado (`COD · DESCRIPCIÓN · PRECIO` dos veces por fila), con títulos de sección (GOLOSINAS, BAZAR…) entre medio | **Principal** |
| `Datos Exportados` | Otra versión de la lista: en ~1.000 códigos el precio difiere de `LISTA` | **Comparación** (PRE-33) |
| `Hoja5` | Parte de `Datos Exportados` en una sola columna | Se ignora |
| `Hoja2` | 20 productos Oblimar con precio de lista y "precio con descuento" (10 %) | Se ignora: esos códigos ya están en `LISTA`; el 10 % es un descuento por bulto ([descuentos por bulto](2026-11-descuentos-por-bulto.md)) |
| `Hoja1` | Promo por cantidad de Toallitas Calipso | Se ignora: es un descuento por bulto |

La hoja `LISTA` se retoca a mano, y eso trae problemas que la importación tiene que resistir:

- Códigos de 6 cifras guardados como texto, con espacios al final y a veces con `"` o `'` adelante (`"006021`).
- ~1.300 precios en 0 y celdas de precio vacías o con un espacio.
- Precios con 3 o 4 decimales (`8875.2959`).
- 16 códigos repetidos: a veces el mismo producto con dos precios (Esencia de Vainilla $897 y $1.190); a veces
  **dos productos distintos con el mismo código** (`006021`: "MARCOLAR Cacerola" en una fila vieja y "Vino
  Cuatro Monos" en la actual). La importación de octubre tomó la primera aparición y dejó unos 10 precios mal
  cargados (Raffaello T3 con el precio de un set Marcolar, entre otros): esta función los detecta.
- La descripción de la lista no siempre coincide con el nombre del artículo (abreviaturas; los nombres de la
  tienda además se reescriben con CAT-24).

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PRE-30 | En el panel, "Actualizar precios con la lista del cliente" recibe el Excel de la distribuidora (hasta 20 MB, los límites del core). Lee la hoja `LISTA`; si no existe, avisa "El archivo no tiene la hoja LISTA" y no sigue. | 🚧 |
| PRE-31 | En cada fila busca grupos de código, descripción y precio, aunque haya varios por fila, y saltea títulos y encabezados. Para leer el código le saca espacios, comillas y apóstrofes, y acepta solo 6 cifras, sin perder los ceros de adelante. Un precio vacío, con espacios o que no es un número cuenta como 0. Los precios se redondean al centavo. | 🚧 |
| PRE-32 | Cada código se busca entre las presentaciones vigentes por su código interno (`cod_ref`). **Solo cambia el precio General**: no toca nombre, foto, categoría, stock, IVA ni el precio anterior. No resta IVA, porque el precio de la lista ya es final (PRE-01). | 🚧 |
| PRE-33 | Si la hoja `Datos Exportados` existe y trae un precio **mayor** que `LISTA` para el mismo código, se usa ese y la fila lo indica ("precio de Datos Exportados"). Solo se comparan precios mayores que 0: si `LISTA` dice 0, el artículo dejó de venderse y no se usa el de `Datos Exportados`. Tampoco se usa si ese código está repetido en `Datos Exportados` con precios distintos. | 🚧 |
| PRE-34 | Un precio 0 en `LISTA` significa que el artículo dejó de venderse (puede volver más adelante). Ese precio **no se toca** y la vista previa avisa cuántos artículos cargados en la tienda quedaron sin precio en la lista, con su listado. Cada presentación guarda **desde cuándo** la lista la trae en 0; la fecha se borra cuando vuelve con precio. | 🚧 |
| PRE-34b | Al aplicar una actualización, los artículos que llevan **más de 6 meses** con precio 0 en la lista se **desactivan** (ya no se pueden pedir) sin tocar su precio. La vista previa los muestra en el grupo "Se desactivan". Si una lista posterior trae precio para un artículo que se desactivó por esta regla, vuelve a la venta con ese precio (grupo "Vuelven a la venta"). Un artículo desactivado a mano no se reactiva solo. | 🚧 |
| PRE-35 | Antes de aplicar, la vista previa agrupa y cuenta: **sube**, **baja**, **sin cambio**, **sin precio en la lista** (PRE-34), **se desactivan** y **vuelven a la venta** (PRE-34b), **a revisar** (PRE-36), **código repetido** (PRE-37), **no está cargado en la tienda** (código con precio mayor que 0 que no existe acá) y **no figura en la lista** (artículos de la tienda con código que la lista no trae). Las dos últimas solo se informan. Cuando un precio baja no se marca oferta: la oferta se carga a mano (PRE-02). | 🚧 |
| PRE-36 | Una fila va **a revisar** cuando su precio varía más del 20 % (hacia arriba o hacia abajo) respecto del precio General actual, o cuando la descripción de la lista casi no comparte palabras con el nombre del artículo. Las filas a revisar no se aplican hasta que alguien las aprueba: se pueden aprobar todas juntas o excluir de a una. Las **extremas** (suba de más del 100 % o baja de más del 50 %) se aprueban de a una. Un artículo con precio actual $0 recibe su primer precio sin revisión. | 🚧 |
| PRE-37 | Si un código aparece más de una vez en `LISTA` con precios distintos, no se aplica hasta que alguien elige cuál vale. La vista previa muestra cada opción con su descripción y el nombre del artículo de la tienda. Si los precios son iguales, se toma uno solo. | 🚧 |
| PRE-38 | Al confirmar se puede marcar "Ajustar también las listas regionales en el mismo porcentaje" (marcada por defecto). Cada excepción regional de una presentación que cambió de precio se multiplica por la misma proporción y se redondea al centavo; su precio anterior no se toca. La vista previa dice cuántas excepciones se van a ajustar. | 🚧 |
| PRE-39 | La actualización queda registrada: quién la hizo, cuándo, con qué archivo, y el precio antes y después de cada fila. Se descarga como informe. La última actualización se puede **deshacer**: vuelve al precio anterior solo las presentaciones cuyo precio sigue siendo el que puso la importación, y lista las que se cambiaron después y no se tocaron. | 🚧 |

Las reglas que ya existen se mantienen: la aplicación por lotes con bloqueo y sin doble aplicación, y el aviso
"El catálogo cambió desde la validación" del importador actual. También sigue igual la revisión de precios al
enviar un pedido (PED-01): quien tenía el producto en el carrito con el precio viejo recibe el aviso al enviar.

**Fuera de alcance:**
- Crear artículos nuevos o actualizar nombres, familias o bultos con el "Listado de Artículos". Es otra spec
  (etapa 3: sincronizar el listado).
- Cargar descuentos por bulto ([2026-11-descuentos-por-bulto](2026-11-descuentos-por-bulto.md)).
- Corregir que la importación general reste IVA a un precio que ya es final. Es un error aparte de ese
  importador, que esta pantalla no usa.

## Diseño

- **API** (servidor en capas, contrato `{ ok, data, mensaje, codigo }`), todo con `requirePermiso("precios.editar")`.
  Esta función solo escribe precios: no pide "Editar artículos" (a diferencia de CAT-42).
  - `POST /api/distribuidora/precios-cliente/validar` (archivo + id de la operación): lee, arma la vista previa,
    la guarda en lotes y devuelve el resumen por grupo.
  - `GET /api/distribuidora/precios-cliente/:id`: resumen y filas de un grupo, paginadas de a 50.
  - `POST /api/distribuidora/precios-cliente/:id/decisiones`: aprobaciones, exclusiones y elección entre repetidos.
  - `POST /api/distribuidora/precios-cliente/:id/lotes/:indice`: aplica un lote (igual que hoy).
  - `POST /api/distribuidora/precios-cliente/:id/deshacer` y `GET …/:id/informe` (CSV).
- **Servidor:**
  - Lector propio `services/importacion/lista_cliente.js`: solo lee el formato y devuelve filas planas
    `{ cod_ref, descripcion, precio, hoja, fila }`.
  - Plan de precios `services/importacion/plan_precios.js`: arma los grupos de PRE-35, PRE-36 y PRE-37.
  - Se reutilizan `read_file.js` del core, el trabajo y los lotes de `importacion_distribuidora_service.js`
    (bloqueos, huella, idempotencia) y el aviso de cambios desde la validación.
  - El ajuste regional de PRE-38 se hace en la misma transacción del lote, con `replacements`.
- **Base de datos:** sin tablas nuevas. Se reutilizan `importacion_catalogo` e `importacion_catalogo_lote`, con
  `opciones.tipo = "precios_cliente"`. Cada registro del lote guarda el precio antes y después y la decisión
  tomada; con eso alcanza para el informe y para deshacer. Para PRE-34 y PRE-34b hacen falta **dos columnas
  nuevas** (cambio de esquema: requiere aprobación y migración probada, subir y deshacer):
  ```text
  variedad_distribuidora.sin_precio_lista_desde   DATE, nulo   → desde cuándo la lista la trae en 0
  producto_distribuidora.inactivo_por_lista       BOOLEAN, falso → lo desactivó PRE-34b (no a mano)
  ```
  No se agrega ningún proceso periódico (por el costo de Neon): los 6 meses se revisan cada vez que se aplica
  una lista. "Deshacer" (PRE-39) también vuelve atrás las desactivaciones y reactivaciones de esa actualización.
- **Pantallas:** nueva entrada en el panel, dentro de Precios.
  1. Subir el archivo.
  2. Resumen en tarjetas por grupo, que al tocarlas muestran sus filas (código, descripción de la lista, nombre en
     la tienda, precio actual → nuevo, variación).
  3. Aprobar o excluir las filas a revisar y elegir entre repetidos.
  4. Confirmar, con la casilla de listas regionales.
  5. Progreso por lotes e informe, con el botón Deshacer.

  Tiene cargando, error con reintentar y archivo sin filas. En celular las filas se ven como tarjetas.
- **Configuración:** `rubros/eccomerce_distribuidora/lista_precios_cliente_config.js`: hoja principal `LISTA`,
  hoja de comparación `Datos Exportados`, umbral de revisión 20 %, extremos +100 % y −50 %, 6 meses sin precio
  para desactivar, y la cantidad
  mínima de palabras en común para el control de nombre (se calibra con el Excel real).

## Tareas

1. [x] Tests (PRE-30 a PRE-39). Los de lectura se arman con un Excel chico que reproduce los casos reales: dos
   bloques, códigos con comillas, precio vacío o con espacio, repetidos con distinto producto y `Datos Exportados`
   mayor. Los de base, en `checkout.integration.mjs`: aplicar, listas regionales, deshacer y cambios concurrentes.
2. [x] Servidor: lector, plan, rutas, controlador y servicio.
3. [x] Frontend: pantalla en el panel, hooks de TanStack Query y prueba de Playwright (escritorio y celular).
4. [x] Probar el plan contra el Excel real **sin aplicar** y revisar los grupos. Los ~10 precios mal cargados en
   octubre tienen que aparecer como repetidos o a revisar.
5. [x] `node scripts/verificar.mjs --completo` en verde.
6. [x] Pasar PRE-30 a PRE-39 a [precios.md](../eccomerce_distribuidora/precios.md) y marcar este cambio como hecho.

**Resultado de la tarea 4** (2026-11-19): el Excel real, contra una copia del catálogo importado en octubre (sin tocar la base),
dio 1.436 sin cambio, 20 suben, 4 a revisar, 3 extremos, 14 códigos repetidos, 16 que no están en la tienda y 69 de la
tienda que no figuran. Los ~475 que la tienda vende y la lista trae en 0 quedan en "sin precio": su plazo de 6 meses
empieza con la primera carga. El umbral de nombre quedó en 40 %: ningún par correcto del catálogo baja de 60 % y los
códigos reasignados dan entre 0 y 25 %.

## Riesgos

- **Los 6 meses empiezan a contar con la primera carga:** no hay historial anterior, así que el primer artículo
  se desactivaría por PRE-34b recién en mayo de 2027. Hasta entonces, los que la lista trae en 0 se siguen
  pudiendo pedir con su precio viejo, salvo que alguien los desactive a mano. Eso incluye los importados en
  octubre desde la hoja "Sin stock".
- **Primera carga:** los precios de la tienda salieron de esta misma hoja `LISTA`, así que casi todas las filas
  van a dar "sin cambio". Las diferencias van a ser los repetidos de octubre y lo que gane `Datos Exportados`.
  Si en alguna actualización futura hay subas generales mayores al 20 %, "aprobar todos" evita revisar de a una.
- **Formato del Excel:** si el cliente cambia el armado de la hoja, el lector deja de encontrar filas. La
  vista previa lo hace visible (casi todo en "no está cargado" o 0 filas) antes de aplicar.
- **Neon:** se lee el catálogo por código en tandas de 500, como el importador actual; no hay consultas
  periódicas nuevas.

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-19 | La hoja que vale es siempre `LISTA`. Se compara con `Datos Exportados` y gana el precio mayor, porque las actualizaciones siempre suben. | Dueño del proyecto |
| 2026-11-19 | Precio 0 = el artículo dejó de venderse (puede volver): no se toca el precio y se avisa cuántos son. | Dueño del proyecto |
| 2026-11-19 | Cuando un precio baja no se marca oferta: la oferta la carga el usuario a mano. | Dueño del proyecto |
| 2026-11-19 | Las listas regionales se ajustan en el mismo porcentaje (con casilla para elegirlo). | Dueño del proyecto |
| 2026-11-19 | Hoja2 (Oblimar): vale el precio de lista; el "precio con descuento" es un descuento por bulto. | Dueño del proyecto |
| 2026-11-19 | Las variaciones mayores al 20 % piden revisión. En las cargas normales no se espera que se supere. | Dueño del proyecto |
| 2026-11-19 | Los artículos con precio 0 en la lista por más de 6 meses se desactivan; si vuelven a la lista con precio, se reactivan. | Dueño del proyecto |

## Preguntas abiertas

Ninguna.
