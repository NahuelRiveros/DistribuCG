# Cambio: descuentos por bulto

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Borrador | Dueño del proyecto | 2026-11-19 | [eccomerce_distribuidora/precios.md](../eccomerce_distribuidora/precios.md) |

## Por qué

La distribuidora premia a quien compra por cantidad, y hoy lo maneja fuera del sistema, en hojas sueltas de su
lista de precios:

- **Toallitas Calipso x8u:** 5 bultos −7 %, 10 bultos −10 %, 20 bultos −15 %, 30 o más −20 % ("negociable").
- **Oblimar:** −10 % comprando por bulto.

La tienda tiene que mostrar esos descuentos, aplicarlos sola en el carrito y en el pedido, y que el equipo los
cargue y los cambie desde el panel.

### Qué es un bulto

En todo el sistema, **bulto** es la palabra única para el envase cerrado que agrupa unidades de venta. Puede ser
una caja, un paquete, un display o un fardo: por ejemplo, 12 paquetes de caramelos = 1 bulto. Ya existe en cada
presentación:

- `unidad_medida`: lo que se vende suelto (paquete, unidad…).
- `unidad_bulto`: cómo se llama el bulto para el cliente (caja, display, fardo…).
- `unidades_por_bulto`: el "Equival" del sistema del cliente.

No se crea una tabla de bultos, porque el sistema del cliente maneja un solo nivel. El cliente de la tienda ve
el nombre de cada presentación ("Caja x 12 paquetes"); en el código, las specs y los textos del panel se dice
**bulto**.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PRE-40 | **Cada artículo tiene su propio descuento por bulto** (por presentación), o ninguno. Se carga en la ficha, junto al precio y las unidades por bulto (CAT-22): una o más escalas (`desde N bultos → %`), vigencia opcional (desde y hasta) y activo o pausado. Solo se ofrece en presentaciones con bulto (`unidades_por_bulto` > 1). Un artículo nuevo arranca sin descuento. | 🚧 |
| PRE-41 | Se cuentan los **bultos completos de la misma presentación** en el carrito: `bultos = cantidad ÷ unidades_por_bulto`, sin decimales. No se suman presentaciones distintas: 2 cajas de Calipso Tanga y 3 de Calipso Pocket no llegan a 5. | 🚧 |
| PRE-42 | Se aplica la escala más alta alcanzada (no se acumulan). El descuento va **solo a las unidades de los bultos completos**; las sueltas pagan el precio de lista. Ej.: caja de 20 a $100 c/u, 5 cajas + 3 paquetes con −7 % → 100 × $93 + 3 × $100. | 🚧 |
| PRE-43 | El descuento se calcula sobre el precio que le corresponde al cliente (General o de su lista regional, PRE-10). Si la presentación está en oferta (PRE-02), se aplica sobre el precio de oferta: **se suman**. | 🚧 |
| PRE-44 | La última escala se puede marcar **negociable**. Se aplica su porcentaje igual, y la tienda muestra "Llevando 30 o más, consultá por un mejor precio". | 🚧 |
| PRE-45 | El descuento se calcula **mientras el cliente va cargando**: cada vez que cambia una cantidad (en el catálogo, el detalle o el carrito), el renglón se recalcula al instante, con el mismo cambio rápido de CAR-06, y muestra si aplica descuento por bulto y cuánto. Si la cantidad no completa ningún bulto de la escala, no hay descuento. El catálogo y el detalle muestran las escalas ("5 cajas −7 % · 10 cajas −10 %…") y el carrito, cuánto falta para la próxima ("Sumá 2 cajas más y ahorrás 10 %"). Catálogo, carrito y pedido usan el mismo cálculo (PRE-13), y el servidor lo vuelve a hacer al guardar y al enviar. | 🚧 |
| PRE-46 | El pedido guarda en cada renglón el precio de lista, el porcentaje aplicado y cuántas unidades lo llevaron: no cambia aunque después se edite el descuento (PED-04). Al enviar, si el descuento cambió, se avisa igual que un cambio de precio (PED-01). El IVA se desglosa al centavo sobre el precio con descuento (PED-60). | 🚧 |
| PRE-47 | El monto mínimo de compra (PED-07) se calcula **después** de los descuentos. | 🚧 |
| PRE-48 | Una presentación tiene como mucho **un** descuento por bulto: la base no admite un segundo. Cambiarlo reemplaza sus escalas. | 🚧 |
| PRE-51 | Para no cargar uno por uno los artículos que llevan la misma promo (los 20 de Oblimar, por ejemplo), el panel permite **copiar unas escalas a varios artículos a la vez**. Se eligen buscando por código o nombre, o filtrando por marca o categoría. Antes de confirmar, avisa cuáles ya tenían descuento y si se reemplaza o se saltean. Es una copia: después cada artículo se edita por separado. | 🚧 |
| PRE-49 | Cargar, cambiar, pausar o quitar un descuento pide "Cambiar precios"; quien no lo tiene ve el descuento en la ficha pero no lo puede editar (como PRE-21). Las escalas tienen bultos enteros de 1 a 10.000, sin repetir, y porcentajes de 0,01 a 90 que crecen con la cantidad. | 🚧 |
| PRE-50 | El vendedor puede mejorar a mano el descuento de un renglón de un pedido. | ❓ pregunta 1 |

**Fuera de alcance:** importar los descuentos desde el Excel (Hoja1 y Hoja2 son texto libre y se cargan a mano
una vez); descuentos por monto total del pedido o por cliente; mezclar presentaciones en una misma escala.

## Diseño

- **Base de datos** (cambio de esquema: requiere aprobación y migración probada, subir y deshacer):
  ```text
  descuento_bulto            id, variedad_id (único), activo, vigente_desde, vigente_hasta, fecha_alta, fecha_mod
  descuento_bulto_escala     id, descuento_id, desde_bultos (int), porcentaje (5,2), negociable (bool)
                             único (descuento_id, desde_bultos)
  nota_pedido_item  +        precio_lista (10,2), descuento_porcentaje (5,2), unidades_con_descuento (int)
                             — nulos en los pedidos viejos
  ```
  PRE-48 lo garantiza el índice único de `variedad_id`. Quitar el descuento borra sus escalas: el pedido ya
  guardó su copia (PRE-46), así que no se pierde historia. Si más adelante el cliente quiere un descuento general
  o por marca que se herede, se agrega un alcance sobre estas mismas tablas sin perder lo cargado.
- **Servidor:** el cálculo vive en un solo lugar: una función pura `calcularDescuentoBulto(cantidad, variedad,
  descuento)` en `rubros/eccomerce_distribuidora/` (la usan también la web y los tests), llamada desde
  `listas_precio_service.js` y `cart_transaction.js`. Los descuentos activos se leen junto con el precio del
  renglón, en la misma consulta (sin N+1). Las rutas de gestión `…/descuentos-bulto` van con
  `requirePermiso("precios.editar")`.
- **Pantallas:** en la ficha del artículo, un bloque "Descuento por bulto" con sus escalas (al lado de "Unidades
  por bulto"). En panel › Precios › Descuentos por bulto, la lista de los artículos que tienen descuento (con
  filtro por marca y categoría) y la copia a varios de PRE-51. En la tienda, una etiqueta de escalas en la tarjeta y en el detalle, y el
  descuento y "cuánto falta" en el carrito. Tiene cargando, error con reintentar y vacío. En celular las escalas
  se ven en una línea que se puede deslizar.
- **Configuración:** sin parámetros nuevos. Los descuentos de Calipso y Oblimar se cargan desde el panel (sus
  presentaciones: `[COMPLETAR]`, confirmar con el cliente cuáles son "Toallitas Calipso x8u").

## Tareas

1. [ ] Aprobar el cambio de esquema y escribir la migración (subir y deshacer).
2. [ ] Tests de PRE-40 a PRE-49. Para el cálculo, en `ux_rules.test.mjs`: escalas, sueltos, oferta + bulto,
   negociable y redondeo. Para el pedido, en `checkout.integration.mjs`: copia, aviso al enviar y mínimo.
3. [ ] Servidor: modelos, cálculo, servicio, rutas y renglón del pedido.
4. [ ] Frontend: gestión en el panel, etiqueta en el catálogo y carrito, y Playwright en escritorio y celular.
5. [ ] `node scripts/verificar.mjs --completo` en verde.
6. [ ] Pasar las reglas a [precios.md](../eccomerce_distribuidora/precios.md) y [pedidos.md](../eccomerce_distribuidora/pedidos.md); marcar este cambio como hecho.

## Riesgos

- **Precio que ve contra precio que paga:** si el carrito y el pedido calculan distinto se rompe PRE-13. Por eso
  hay una sola función de cálculo y un test que compara las dos salidas.
- **Redondeo:** el precio con descuento se redondea al centavo por unidad antes de multiplicar, para que el
  desglose de IVA (PED-60) cierre.
- **Pedidos viejos:** las columnas nuevas quedan vacías y se leen como "sin descuento".

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-19 | "Bulto" es la palabra única (caja, paquete, display…); el nombre que ve el cliente sale de cada presentación. No se crea una tabla de bultos. | Dueño del proyecto |
| 2026-11-19 | Los descuentos por bulto van en tablas propias (descuento, escalas, presentaciones). | Dueño del proyecto |
| 2026-11-19 | Los bultos se cuentan por presentación: no se suman artículos distintos. | Dueño del proyecto |
| 2026-11-19 | Las unidades sueltas pagan el precio de lista, sin descuento. | Dueño del proyecto |
| 2026-11-19 | Escala negociable: se aplica su porcentaje, se muestra "consultá" y el vendedor lo mejora a mano. | Dueño del proyecto |
| 2026-11-19 | El descuento por bulto se suma a la oferta. | Dueño del proyecto |
| 2026-11-19 | El mínimo de compra se calcula después del descuento. | Dueño del proyecto |
| 2026-11-19 | El descuento se calcula en el momento, mientras el cliente carga cantidades, y solo si completa bultos. | Dueño del proyecto |
| 2026-11-19 | Cada artículo tiene su propio descuento por bulto, que se carga en su ficha. Para las promos de varios artículos se copian las escalas a todos juntos. No hay descuentos heredados por marca ni por categoría (a confirmar con el cliente, pregunta 3). | Dueño del proyecto |

## Preguntas abiertas

1. **PRE-50: ¿cómo mejora el vendedor el descuento "a mano"?** Hoy un pedido enviado no permite cambiar precios.
   Opciones: (a) **recomendada:** en los estados Recibido y Confirmado, "Cambiar descuento" de un renglón. Pide
   motivo, queda en el historial (PED-12), recalcula el total y le avisa al cliente con el aviso de cambio de
   estado. Necesita un permiso nuevo, "Ajustar descuentos de pedidos" (de entrada, solo Supervisor y Admin).
   (b) Que se arregle por fuera (WhatsApp o factura), sin tocar el pedido.
   **Respuesta:**
2. **"Mismo artículo": ¿por presentación o por artículo?** Lo escrito cuenta por presentación, porque cada una
   tiene su propio bulto. Si un artículo tuviera dos presentaciones con bultos distintos, ¿se sumarían? Los
   artículos importados del cliente llevan una presentación cada uno, así que en la práctica casi no cambia nada.
   **Respuesta:**
3. **Para el cliente: ¿cada artículo tiene su propio descuento por bulto?** Así quedó diseñado (decisión del
   dueño del proyecto, 2026-11-19), con la copia a varios artículos para las promos de una marca. Si el cliente
   dice que hay un descuento que vale para todo, o para una marca entera, incluidos los artículos que se carguen
   después, se agrega un alcance heredado sin perder lo cargado.
   **Respuesta:**
