# Cambio: precio de venta desde el costo neto, la rentabilidad y el IVA

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-20 | [eccomerce_distribuidora/precios.md](../eccomerce_distribuidora/precios.md) |

Reemplaza a [2026-11-costo-y-rentabilidad.md](2026-11-costo-y-rentabilidad.md) (aprobada el 16/11, sin programar): conserva
sus decisiones y suma el ajuste masivo sobre el costo, la importación y los avisos. Sus códigos PRE-30 a PRE-35 chocaban
con los de "Actualizar precios"; acá van de PRE-60 en adelante.

## Por qué

Hoy la ficha pide el precio de venta final (con IVA) y muestra el neto. Al dar de alta un artículo, el personal conoce
el **costo neto** (lo que cobra el proveedor, sin IVA) y la **rentabilidad** que quiere ganar: quiere cargar esos dos
datos y que el sistema arme el precio final con el IVA. Lo que llega importado sin rentabilidad ya es el precio final
(bruto) y se sigue tomando como hoy.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PRE-60 | **Costo y rentabilidad guardados.** Cada presentación puede guardar su **costo neto** (sin IVA ni ganancia) y su **rentabilidad %**, los dos opcionales: un artículo sin costo funciona como hoy. | ✅ |
| PRE-61 | **Cálculo:** rentabilidad **sobre el costo** y después el IVA, redondeado a **pesos enteros**: `precio = redondeo(costo × (1 + rentabilidad/100) × (1 + IVA/100))`. Ej.: costo $1.000, 30 %, IVA 21 % → $1.300 neto → **$1.573**. Una sola regla para la ficha, la importación, el ajuste masivo y el servidor (el servidor recalcula: no confía en el precio que manda la pantalla). | ✅ |
| PRE-62 | **Dos formas de cargar** el precio en la ficha de cada presentación: **"Desde el costo"** (costo + rentabilidad % + IVA) o **"Precio final"** (como hoy). Desde el costo, la ficha muestra el desglose antes de guardar ("$1.000 + 30 % = $1.300 + IVA 21 % = $1.573 · ganás $300 por unidad") y cambiar costo, rentabilidad o IVA lo recalcula. | ✅ |
| PRE-63 | **Precio final a mano:** se guarda el precio escrito; el costo se conserva y la **rentabilidad se recalcula** con ese precio (`precio ÷ (1 + IVA) ÷ costo − 1`), para que la ficha muestre la ganancia real. | ✅ |
| PRE-64 | **Ajuste masivo de precios:** en las presentaciones con costo, el porcentaje se aplica al **costo neto** y el precio final se recalcula con PRE-61, manteniendo la rentabilidad (ej.: costo $1.000 +10 % = $1.100 → $1.100 × 1,30 × 1,21 = $1.730). Sin costo, se ajusta el precio final como hoy. | ✅ |
| PRE-65 | **Actualizar precios con la lista del cliente** (PRE-30 a PRE-39): la lista trae precios finales; no toca el costo y la rentabilidad se recalcula como en PRE-63. Las listas regionales no tocan costo ni rentabilidad (son excepciones de precio, PRE-10). | ✅ |
| PRE-66 | **Importación del catálogo:** columnas opcionales "Costo neto" y "Rentabilidad %". Fila con las dos: el precio se calcula con PRE-61 (pisa la columna Precio) y se guardan. Fila sin rentabilidad: la columna Precio es el **precio final (bruto)**, como hoy; si trae costo, se guarda igual. | ✅ |
| PRE-67 | **Aviso de pérdida:** si un precio queda por debajo del costo con IVA (rentabilidad negativa), se avisa en rojo, sin bloquear: en la ficha ("Estás vendiendo por debajo del costo"), en la revisión de **Actualizar precios** (filas marcadas y cantidad en el resumen) y en la vista previa del **ajuste masivo** y de la **importación** ("N artículos quedarían por debajo del costo"). Ej.: costo $1.000 (con IVA $1.210) y la lista lo trae a $1.150. | ✅ |
| PRE-68 | **Rentabilidad propia de cada artículo:** no hay un valor general. Al agregar otra presentación a un artículo, se propone la rentabilidad de la que ya tiene (se puede cambiar). | ⏸ La ficha maneja una presentación por artículo |
| PRE-69 | **Validaciones:** costo mayor a 0 y hasta $99.999.999; rentabilidad de 0 % a 1.000 % (hasta 2 decimales); en "Desde el costo" los dos son obligatorios. | ✅ |
| PRE-70 | **Datos internos:** costo y rentabilidad solo los ve y los cambia quien tiene `precios.editar` (PRE-21). La tienda, el carrito, los pedidos y las exportaciones para el cliente **nunca** los devuelven. El respaldo del catálogo (CAT-65) los incluye. | ✅ |

**Fuera de alcance (para después):** rentabilidad por categoría o general; redondeos comerciales ($10, $50); reporte
de rentabilidad; historial de costos por proveedor; rentabilidad en las listas regionales.

## Diseño

- **Base:** dos columnas nuevas en `variedad_distribuidora`: `costo_neto numeric(10,2)` y `rentabilidad numeric(6,2)`,
  nulas. Las crea el arranque (`sync`), como las anteriores; ninguna fila existente cambia.
- **Regla pura compartida** (`rubros/eccomerce_distribuidora/precio_desde_costo.js`, frontend y servidor):
  `precioDesdeCosto({ costo, rentabilidad, iva })`, `rentabilidadResultante({ costo, precio, iva })` y
  `debajoDelCosto({ costo, precio, iva })`.
- **API:** la ficha recibe por presentación `modo_precio` (`"costo"` | `"final"`) y, según el modo, `costo_neto` +
  `rentabilidad` o `precio`. Las respuestas de la gestión devuelven costo y rentabilidad; las de la tienda no los
  seleccionan.
- **Masivos:** el ajuste masivo y la importación calculan en el servidor; la lista del cliente recalcula la
  rentabilidad en el mismo paso en que aplica el precio. Las vistas previas cuentan los que quedarían bajo el costo.
- **Pantallas:** ficha (selector, desglose, aviso), revisión de Actualizar precios, vista previa del ajuste masivo y
  de la importación. Carga, error y celular como el resto.

## Tareas

1. [x] Aprobar esta spec (2026-11-20).
2. [x] Tests: cuenta y redondeo (IVA 0, 10,5, 21 y 27), validaciones, rentabilidad recalculada, ajuste masivo sobre
   el costo, importación con y sin rentabilidad, avisos, que la tienda no reciba costo ni rentabilidad, permiso.
3. [x] Servidor: columnas, regla, ficha, ajuste masivo, importación, lista del cliente, respuestas.
4. [x] Frontend: selector, desglose, avisos en ficha y en los masivos.
5. [x] `node scripts/verificar.mjs --completo` en verde y capturas en escritorio y celular.
6. [x] Pasar las reglas a `precios.md` y marcar este cambio como hecho.

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-11-16 | PRE-60 | Guardar costo y rentabilidad (no solo calcular). Confirmado de nuevo el 20/11. | Dueño del proyecto |
| 2026-11-16 | PRE-61 | Rentabilidad sobre el costo (no sobre el precio de venta); redondeo a pesos enteros. Confirmado el 20/11. | Dueño del proyecto |
| 2026-11-16 | PRE-68 | Sin rentabilidad general: cada artículo tiene la suya. | Dueño del proyecto |
| 2026-11-20 | PRE-64 | El ajuste masivo cambia el costo neto y recalcula el precio (antes: solo el precio final). | Dueño del proyecto |
| 2026-11-20 | PRE-66 | La importación sin rentabilidad trae el precio final (bruto). | Dueño del proyecto |
| 2026-11-20 | PRE-67 | Avisos de precio por debajo del costo, también en los cambios masivos. | Dueño del proyecto |
| 2026-11-20 | PRE-62 | Ficha simple, sin elegir modo: precio neto + IVA + rentabilidad = precio final; sin neto, el final se escribe a mano. | Dueño del proyecto |

## Preguntas abiertas

Ninguna.
