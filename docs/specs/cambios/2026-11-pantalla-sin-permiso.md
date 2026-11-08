# Cambio: aviso al abrir una pantalla del panel sin permiso

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Borrador | Dueño del proyecto | 2026-11-08 | [core/panel.md](../core/panel.md) |

## Por qué

Quien abre una dirección del panel sin el permiso que pide (un enlace viejo, o porque le sacaron el
permiso) aparece en la portada de la tienda y no entiende qué pasó.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PAN-04 | Si la persona tiene panel, va al inicio del panel y ve el aviso "No tenés permiso para ver esa pantalla". Si no tiene panel (un cliente), va a la portada de la tienda, como hoy. | 🚧 |

**Fuera de alcance:** pedirle el permiso al admin desde el aviso; cambiar qué pasa sin sesión (va a
ingresar, PAN-03).

## Diseño

- **API y base de datos:** sin cambios.
- **Frontend:** `controls/acceso/protected_route.jsx`, en el caso "tiene sesión pero no cumple": si cumple el
  acceso al panel (`accesoPanel` de `panel_gestion.js`) lo lleva a `/panel` con el aviso en el estado de la
  navegación; si no, a `/` como hoy. El inicio del panel muestra el aviso con el componente de avisos que ya
  usa la app.
- **Pantallas:** solo el aviso en el inicio del panel; igual en computadora y celular.

## Tareas

1. [ ] Tests de navegador (fallan al principio): un vendedor que abre `/distribuidora/admin/productos` termina
   en `/panel` con el aviso; un cliente que abre la misma dirección termina en la portada, sin aviso.
2. [ ] Frontend: `protected_route.jsx` y el aviso en `panel_inicio_page.jsx`.
3. [ ] `node scripts/verificar.mjs --completo` en verde y revisión visual en escritorio y celular.
4. [ ] Pasar PAN-04 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Que el aviso quede fijo:** debe aparecer una vez por cada intento, no cada vez que se vuelve al inicio.
