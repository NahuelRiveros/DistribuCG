# Módulo: eccomerce_indumentaria

Adaptado desde un proyecto de e-commerce existente (carpeta de referencia
`frontend/eccomerce/`, fuera de `src/`). Pensado para venta de indumentaria
(talle/color) — de ahí el nombre, aunque el stock por variante todavía no
está armado (ver más abajo). Módulo **opcional** — nada de esto está cableado
al resto de la app todavía. Se activa desde `src/config/cart_config.js`
(`enableCart`) y `src/config/catalog_config.js`, no tocando código.

## Estructura

```
src/modules/eccomerce_indumentaria/
  carrito/            motor de carrito (ver detalle abajo)
  productos/           motor de catálogo + admin de stock bajo
```

## Qué trae — `carrito/`

- `cart_context.jsx` — `CartProvider`/`useCart`: estado del carrito,
  agregar/quitar/cambiar cantidad, totales, detección de alertas (precio
  cambiado, variante no disponible, sin stock).
- `cart_api.js` — llamadas REST a `/carrito` (backend no incluido).
- `validations/cart_validators.js` — sanitizar cantidad, validar stock.
- `validations/cart_staleness.js` — detecta inconsistencias al recargar el
  carrito (ver la cabecera del archivo para el contrato con el backend).

## Qué trae — `productos/`

- `producto_api.js` — CRUD de productos, ofertas destacadas, stock bajo,
  export/import de catálogo por CSV. **No incluye stock por variante**
  (talle/color) — eso es específico de indumentaria y quedó afuera a
  propósito (ver el proyecto de referencia `eccomerce/components/admin/product_form/`
  si el próximo cliente es de indumentaria y hace falta traerlo).
- `admin_stock_alerts_page.jsx` — dashboard de productos agotados / con
  stock bajo. Restyleado a la paleta slate del resto del admin (el original
  usaba tokens propios `--color-navy`/`--color-muted`/etc. que no existen acá).

Complementa `controls/ui/admin_spinner.jsx`, `admin_stat_card.jsx` y
`admin_empty_state.jsx` — esos sí son genéricos y quedaron en `controls/`
(no en este módulo) porque cualquier admin, tenga o no e-commerce, los puede
usar.

## Qué falta para activarlo en un proyecto

1. Backend con los endpoints de `/carrito` y `/productos` (ver los `*_api.js`
   para el shape exacto esperado en cada caso).
2. Envolver la app con `<CartProvider>` (en `main.jsx`, junto a `AuthProvider`).
3. Rutas: `/carrito`, `/catalogo`, `/admin/productos/stock-bajo`, etc. — página
   de carrito y catálogo público **no están adaptadas todavía** (la del
   proyecto original usa su propio design system y `framer-motion`, que no es
   dependencia de este proyecto; hay que decidir si se suma o se rehace sin él).
4. Ícono de carrito en el navbar (`controls/layout/navbar/`), condicionado a
   `cartConfig.enableCart`.
5. Poner `enableCart`/`enableCheckout`/`enablePayments` en `cart_config.js` y
   ajustar `catalog_config.js` según corresponda.

## 1.0.0 — 2026-08-31

- `carrito/`: extracción inicial del motor (context + api + validations).
  Generalizado `talle_id` → `variante_id`/`variante`.
- `productos/`: `producto_api.js` (sin stock por variante) +
  `admin_stock_alerts_page.jsx`, restyleados a la paleta del proyecto.
  `AdminSpinner`/`AdminStatCard`/`AdminEmptyState` sumados a `controls/ui/`.
- Sin UI de catálogo público ni de variantes talle/color todavía — quedó en
  la carpeta de referencia `eccomerce/` para una siguiente pasada si el
  próximo cliente lo necesita.
