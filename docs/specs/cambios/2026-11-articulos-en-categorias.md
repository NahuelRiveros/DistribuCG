# Cambio: ver y agregar artículos desde Familias y categorías

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-08 | [eccomerce_distribuidora/catalogo.md](../eccomerce_distribuidora/catalogo.md) |

## Por qué

En "Familias y categorías", tocar "4 artículos" lleva a otra pantalla (Artículos con filtro). Quien está
ordenando el catálogo pierde el lugar: quiere ver qué hay en esa categoría y agregar ahí mismo.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CAT-04 | Tocar una categoría (su nombre o su "N artículos") la despliega ahí mismo, debajo, con sus artículos; tocarla de nuevo la cierra. Una sola abierta por vez. | ✅ |
| CAT-05 | Cada artículo muestra nombre, código, precio General, stock (en bultos si corresponde) y la etiqueta "Inactivo" si lo está: se ven todos, igual que los cuenta el contador. Tocarlo abre su ficha, y "Volver" regresa a esta misma categoría abierta. | ✅ |
| CAT-06 | En la categoría abierta, "+ Artículo en <categoría>" abre la ficha nueva con la familia y la categoría ya elegidas. | ✅ |
| CAT-07 | Los artículos se piden recién al abrir la categoría, de a 10, con "Ver más"; "Abrir en Artículos" lleva a la pantalla completa con filtros. Cargando, error con "Reintentar" y vacía ("Todavía no hay artículos en …" con el botón para agregar). | ✅ |
| CAT-08 | La dirección guarda la categoría abierta (`?familia=…&categoria=…`): al recargar o volver atrás sigue abierta. | ✅ |

**Fuera de alcance:** activar o desactivar, mover o editar artículos desde la lista (se hace en la ficha);
lo mismo para los artículos cargados directo en la familia.

## Diseño

- **API:** sin cambios. Se usa la misma consulta de la pantalla Artículos (`GET /distribuidora/productos`
  con `categoria`, `pagina` y `por_pagina=10`), que ya devuelve activos e inactivos a la gestión.
- **Base de datos:** sin cambios. Una consulta paginada por categoría abierta, solo cuando se abre.
- **Pantallas:** `admin/categorias_page.jsx` (despliegue en `DetalleFamilia`) y un componente nuevo para la
  lista de artículos de una categoría, con TanStack Query (clave por categoría y página). La ficha nueva ya
  acepta `?familia=` con una categoría (`categoriaInicial`). En celular la lista ocupa todo el ancho.

## Tareas

1. [x] Tests de navegador (fallan al principio): abrir y cerrar una categoría; artículos con inactivo marcado;
   "Ver más"; vacía con agregar; "+ Artículo" con la categoría elegida; volver desde la ficha con la categoría
   abierta; error con reintentar.
2. [x] Frontend: despliegue en `categorias_page.jsx` y la lista paginada.
3. [x] `node scripts/verificar.mjs` y Playwright en verde; revisión visual en escritorio y celular.
4. [x] Pasar CAT-04 a CAT-08 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Familias con muchas categorías:** no cambia nada, porque los artículos se piden solo de la categoría abierta.
- **Contador desactualizado:** después de agregar un artículo y volver, se refrescan el contador y la lista.

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-08 | Desde la lista solo se ve y se abre la ficha; se descartaron activar o desactivar y mover desde ahí. Los inactivos se muestran marcados, para que coincida con el contador. | Dueño del proyecto |
