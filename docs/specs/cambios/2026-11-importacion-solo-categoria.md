# Cambio: la importación tampoco deja artículos nuevos directo en una familia

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-10 | [eccomerce_distribuidora/catalogo.md](../eccomerce_distribuidora/catalogo.md) |

## Por qué

Desde CAT-15 la ficha y el servidor no dejan un artículo directo en una familia, pero la importación de
planillas sí: una fila con un solo nivel ("Almacén") creaba el artículo en la familia. Quedó fuera de alcance
en [2026-11-articulo-solo-en-categoria](2026-11-articulo-solo-en-categoria.md) para tratarlo aparte.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CAT-17 | Al importar, una fila que **crea** un artículo con un solo nivel de categoría queda como error en la vista previa: "Indicá familia y categoría (ej: Almacén > Galletitas): un artículo nuevo no puede ir directo en la familia." Las filas que actualizan artículos existentes siguen funcionando (la importación no les cambia la categoría). | ✅ |

**Fuera de alcance:** crear sola una categoría "General" para esas filas (sería una decisión de negocio:
hoy se corrige la planilla o se usa la categoría predeterminada con dos niveles).

## Diseño

- **API, base de datos y pantallas:** sin cambios. La regla va en `services/importacion/plan.js`
  (`buildPlan`), donde ya se rechazan las filas sin nombre o sin categoría; la vista previa muestra el error
  de cada fila como hoy.

## Tareas

1. [x] Test (`ux_rules.test.mjs` › "CAT-17: …"): fila nueva en familia → error; en categoría → crea; existente → actualiza.
2. [x] Regla en `buildPlan`.
3. [x] `node scripts/verificar.mjs` y CAT-17 en la spec del módulo.

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-10 | Se aplica a la importación la misma regla ya decidida para la ficha (CAT-13/CAT-15): sin categoría automática. | Dueño del proyecto |
