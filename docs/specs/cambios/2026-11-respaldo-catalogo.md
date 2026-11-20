# Cambio: respaldo del catálogo (planilla y fotos)

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-20 | [eccomerce_distribuidora/catalogo.md](../eccomerce_distribuidora/catalogo.md) |

## Por qué

El catálogo ya tiene ~6.900 presentaciones con su código, precio, bulto y foto, y el cliente va a seguir relacionando
fotos con artículos. Ese trabajo no se tiene que perder: hace falta poder bajarlo entero y guardarlo fuera del sistema
(planilla y fotos), y poder volver a subir las fotos si algún día se pierden en Cloudinary.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CAT-65 | En Artículos, "Descargar respaldo" baja una planilla (CSV para Excel: UTF-8, punto y coma, coma decimal) con cada presentación vigente: código, artículo, presentación, familia, categoría, marca, precio, precio anterior, IVA, unidad, unidades por bulto, envase, código de barras, si está a la venta, descripción, link de la foto e ID. Incluye lo oculto; no lo dado de baja. Solo quien tiene `productos.editar` o `precios.editar`. | ✅ |
| CAT-66 | `npm --prefix servidor run catalogo:respaldo [-- "<carpeta>"]`, desde la PC del usuario, **solo lee** la base de `.env.produccion` y deja la misma planilla más cada foto en su tamaño guardado (sin las transformaciones de la tienda). Se puede cortar y volver a correr sin repetir lo bajado. | ✅ |
| CAT-67 | Las fotos se nombran con el código más bajo de su artículo y van con un `_indice.json` en el formato de `imagenes:subir`: restaurarlas es `npm --prefix servidor run imagenes:subir -- "<carpeta>/fotos" --todas`, y el arranque las vuelve a asignar por código. | ✅ |

**Fuera de alcance:** bajar las fotos desde el panel (un ZIP de ~1.300 fotos cuelga el servidor gratis de Render),
restaurar precios desde la planilla (para eso está "Actualizar precios" o la importación del catálogo).

## Diseño

- `services/respaldo_catalogo_service.js`: `filasRespaldo` (una consulta), `armarCsvRespaldo`, `indiceFotosRespaldo`
  y `urlOriginal`, puros y probados en `respaldo_catalogo.test.mjs`.
- `GET /api/distribuidora/productos/respaldo` (`requirePermiso("productos.editar", "precios.editar")`).
- `seed/respaldo_catalogo.js` (comando `catalogo:respaldo`), 4 descargas a la vez.

## Pruebas

`respaldo_catalogo.test.mjs` (CAT-65 a CAT-67) y `checkout.integration.mjs` › "CAT-65: …".
