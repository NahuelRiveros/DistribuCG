# Cambio: la tienda muestra solo lo que se puede comprar y el inicio arranca con fotos

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-19 | [eccomerce_distribuidora/catalogo.md](../eccomerce_distribuidora/catalogo.md) |

## Por qué

Después de cargar el catálogo del cliente (6.500 artículos, 1.381 con precio):

- El inicio mostraba los primeros artículos por orden alfabético, casi todos sin foto ("10mtos Chi 70g Poxilina").
- Los artículos con varias presentaciones mostraban "Desde $ 0,00": la lista del cliente trae algunas presentaciones en 0
  (PRE-34: un 0 no pisa el precio, solo alerta) y la tienda las contaba.
- Los números de las categorías contaban los artículos ocultos (Almacén 799 cuando se ven muchos menos).

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CAT-61 | El inicio muestra una fila por familia (góndolas): 3 familias, las elegidas en `home_config.js` › `familiasDestacadas` y, si faltan, al azar entre las que tienen artículos a la venta, con una elección que cambia una vez por día (hora de Argentina) y no en cada visita; 8 artículos por fila, primero los que tienen foto (y entre ellos, por nombre), en carrusel, con "Ver todo" a la familia. El recuadro de arriba toma 3 con foto. El catálogo (Productos) sigue por orden alfabético: ahí la gente busca. | ✅ |
| CAT-62 | Una presentación está a la venta solo con precio mayor a 0 para la lista de quien mira. La tienda (listado, ficha, ofertas) no muestra las presentaciones en $0 ni los artículos sin ninguna a la venta; el carrito no deja agregarlas, y si una quedó en $0 después de agregarla aparece como no disponible y el pedido no sale. La gestión sigue viéndolas para cargarles precio. | ✅ |
| CAT-64 | Las pantallas de la tienda (inicio, Productos, ficha, carrito) piden `?vista=tienda` y el personal ve lo mismo que un cliente; antes, con un usuario de gestión, la tienda mostraba ocultos y presentaciones en $0. El panel de Artículos sigue viendo todo. | ✅ |
| CAT-63 | En la tienda, el número de cada categoría cuenta solo los artículos a la venta para la lista de quien mira; la gestión (permiso `productos.editar` o `precios.editar`) ve el total, ocultos incluidos. | ✅ |

**Fuera de alcance:** ocultar en la tienda las categorías que quedan sin artículos a la venta (hoy se ven sin número).

## Diseño

- Servidor: `condicionALaVenta(listaId)` (`producto_distribuidora_service.js`) filtra por SQL, así la paginación y los
  totales coinciden; `soloALaVenta` (`articulo_rules.js`) saca las presentaciones en $0 después de aplicar la lista.
  `GET /api/distribuidora/productos?orden=con_foto` (allowlist `ORDENES_LISTADO`). `GET /catalogos/categorias` pasa a
  `optionalAuth` para saber la lista y si quien pide es gestión. Las ofertas exigen además precio mayor a 0.
- Carrito: `addToCart` responde 409 `SIN_PRECIO`; `listarItemsCarrito` marca `variante_disponible: false`, que ya frena
  el envío del pedido.
- Frontend: `home_tienda.jsx` elige las familias con `elegirFamiliasDestacadas` (`utils/categoria_jerarquia.js`) y
  `filas_por_familia.jsx` pide cada una con `por_pagina: 8, orden: "con_foto"`.

## Pruebas

`ux_rules.test.mjs` › "CAT-62: …" y `checkout.integration.mjs` › "CAT-61 a CAT-64: …".
