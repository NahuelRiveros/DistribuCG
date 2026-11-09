# Cambio: el artículo va siempre en una categoría, con un selector más claro

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-08 | [eccomerce_distribuidora/catalogo.md](../eccomerce_distribuidora/catalogo.md) |

## Por qué

En la ficha del artículo, "Familia / categoría" ofrece familias y categorías mezcladas en una lista plana
("Alimentos Naturales", "Alimentos Naturales › Avena", …). Se puede dejar un artículo en la familia sola,
que no es lo que se quiere: un artículo va en Alimentos Naturales › Avena, nunca en Alimentos Naturales.
Además la lista es difícil de leer: el nombre de la familia se repite en cada renglón.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CAT-13 | En la ficha del artículo el campo se llama "Categoría" y solo ofrece categorías: las familias no se pueden elegir. | ✅ |
| CAT-14 | La lista se agrupa por familia: el nombre de la familia es un título y debajo van sus categorías con su cantidad de artículos. Buscar "naturales" trae todas las categorías de esa familia; buscar "avena" trae Avena. Elegida, se lee "Alimentos Naturales › Avena". | ✅ |
| CAT-15 | El servidor rechaza crear o guardar un artículo en una familia (o en una categoría dada de baja) con el mensaje "Elegí una categoría: el artículo no puede ir directo en la familia." | ✅ |
| CAT-16 | Un artículo viejo que quedó directo en una familia abre su ficha con el campo vacío y el aviso "Estaba en la familia X sin categoría: elegí una para guardarlo." El "+ Artículo" de la familia se mantiene y abre la ficha sin categoría elegida. | ✅ |

**Fuera de alcance:** la importación de planillas (si una fila trae un solo nivel hoy queda en la familia;
se puede tratar aparte) y los filtros de Artículos y Marcas, que siguen permitiendo filtrar por familia.

## Diseño

- **API:** sin rutas nuevas. `POST` y `PUT /distribuidora/productos` validan que `categoria_id` sea una
  categoría activa con familia (`padre_id`), con una regla pura testeable en `articulo_rules.js`.
- **Base de datos:** sin cambios.
- **Pantallas:** `utils/categoria_jerarquia.js` (opciones solo de categorías, agrupadas), `controls/ui/combobox_field.jsx`
  (busca también por la familia con `buscar` y muestra la ruta completa al elegir con `seleccion`), `admin/producto_form.jsx`,
  `admin/articulo_form_page.jsx` y `admin/marca_field.jsx` (texto).

## Tareas

1. [x] Tests primero: regla del servidor y armado de opciones (`ux_rules.test.mjs`); integración (CAT-15);
   Playwright de la ficha (CAT-13, CAT-14, CAT-16).
2. [x] Servidor: regla y validación en alta y edición.
3. [x] Frontend: opciones agrupadas, buscador y ficha.
4. [x] `node scripts/verificar.mjs`, Playwright y revisión visual en escritorio y celular.
5. [x] Pasar CAT-13 a CAT-16 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Artículos viejos en una familia:** siguen funcionando y se ven en la tienda; solo hay que elegirles
  categoría la próxima vez que se guardan (CAT-16).
- **Familia sin categorías:** no se le pueden cargar artículos hasta crearle una (se hace en la misma pantalla).

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-08 | El artículo solo puede ir en una categoría (Familia › Categoría), nunca directo en la familia. | Dueño del proyecto |
| 2026-11-08 | "Mejorar cómo se ve" es el combo de la ficha (CAT-14), nada más: el "+ Artículo" de la familia queda como está. | Dueño del proyecto |
