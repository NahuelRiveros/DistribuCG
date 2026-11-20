# Cambio: cargar el precio desde el costo, con rentabilidad e IVA

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Reemplazada por [2026-11-costo-y-margen.md](2026-11-costo-y-margen.md) (2026-11-20) | Dueño del proyecto | 2026-11-16 | [eccomerce_distribuidora/precios.md](../eccomerce_distribuidora/precios.md) |

## Por qué

La distribuidora conoce el **costo** de cada artículo (sin IVA y sin su ganancia), pero hoy la ficha solo
acepta el **precio final** (con todo incluido): el cálculo se hace aparte, a mano, y el costo no queda
registrado. Se quiere poder cargar el costo y la rentabilidad y que el sistema calcule el precio, o cargar el
final directo como hasta ahora.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PRE-30 | **Costo y rentabilidad guardados.** Cada presentación puede guardar su **costo** (sin IVA ni rentabilidad) y su **rentabilidad %**, los dos opcionales. Solo los ve y los cambia quien tiene "Cambiar precios"; nunca llegan a la tienda ni a los clientes (catálogo, carrito, pedido, exportaciones para el cliente). | 🚧 |
| PRE-31 | **Dos formas de cargar el precio** en la ficha de cada presentación: **"Desde el costo"** (costo + rentabilidad % + IVA % de la presentación) o **"Precio final"** (como hoy, ya con todo incluido). | 🚧 |
| PRE-32 | **Cálculo desde el costo:** rentabilidad **sobre el costo** y después el IVA, redondeado a **pesos enteros**: `precio = redondeo(costo × (1 + rentabilidad/100) × (1 + IVA/100))`. Ej.: costo $1.000, 30 %, IVA 21 % → $1.300 neto → **$1.573**. La ficha muestra el desglose (costo, ganancia, neto, IVA, final) antes de guardar; cambiar el IVA recalcula. El servidor hace la misma cuenta: el precio que se guarda es el que él calcula. | 🚧 |
| PRE-33 | **Precio final directo:** se guarda el precio escrito; el costo y la rentabilidad guardados no cambian. Si la presentación tiene costo, la ficha muestra la **rentabilidad que resulta** con ese precio (informativa). | 🚧 |
| PRE-34 | **Rentabilidad propia de cada artículo:** no hay un valor general. Al agregar otra presentación a un artículo, se propone la rentabilidad de la que ya tiene (se puede cambiar). | 🚧 |
| PRE-35 | **Validaciones:** costo mayor a 0 y hasta $99.999.999; rentabilidad de 0 % a 1000 % (hasta 2 decimales); en "Desde el costo" los dos son obligatorios. Quien no tiene "Cambiar precios" no puede enviarlos (PRE-21). | 🚧 |

**Fuera de alcance (para después):** actualizar costos en masa y recalcular precios; columnas de costo y
rentabilidad en la importación; rentabilidad por categoría o general; rentabilidad en las listas regionales (sus
precios siguen siendo finales). El ajuste masivo (PRE-20) sigue cambiando el precio final, sin tocar el costo.

## Diseño

- **Base de datos:** `variedad_distribuidora.costo` numeric(10,2) nulo y `variedad_distribuidora.rentabilidad`
  numeric(6,2) nulo. Sin datos que migrar (las presentaciones actuales quedan sin costo).
- **Regla pura compartida** (servidor y ficha): `rubros/eccomerce_distribuidora/precio_desde_costo.js` →
  `precioDesdeCosto({ costo, rentabilidad, iva })` y `rentabilidadResultante({ costo, precio, iva })`.
- **API:** la ficha del artículo recibe por presentación `modo_precio` (`"costo"` | `"final"`), y según el modo
  `costo` + `rentabilidad` o `precio`. Las respuestas de la gestión devuelven `costo` y `rentabilidad`; las de la
  tienda no.
- **Pantallas:** en la ficha, por presentación, un selector "Desde el costo / Precio final" con el desglose.
  Carga, error y celular como el resto de la ficha.

## Tareas

1. [x] Aprobar esta spec (2026-11-16; se programa más adelante).
2. [ ] Tests: cuenta y redondeo (incluido IVA 10,5 y 0), validaciones, que la tienda no reciba el costo, permiso.
3. [ ] Servidor: columnas, regla, guardado en la ficha, respuestas.
4. [ ] Frontend: selector, desglose, rentabilidad propuesta y resultante.
5. [ ] `node scripts/verificar.mjs --completo` en verde y capturas en escritorio y celular.
6. [ ] Pasar las reglas a `precios.md` y marcar este cambio como hecho.

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-11-16 | PRE-32 | Rentabilidad sobre el costo (no sobre el precio de venta); redondeo a pesos enteros. | Dueño del proyecto |
| 2026-11-16 | PRE-30 | Guardar costo y rentabilidad (no solo calcular). | Dueño del proyecto |
| 2026-11-16 | PRE-34 | Sin rentabilidad general: cada artículo tiene la suya. | Dueño del proyecto |
