---
name: dominio-ecommerce
description: Reglas de negocio para el catálogo y la tienda online — categorías, productos, variantes, precios con IVA, catálogo público, carrito invitado y de cuenta, pedidos con estados y cobros, perfil de cliente. Usar al diseñar o modificar cualquier flujo de catálogo, publicación o venta.
---

# Dominio e-commerce (módulos `catalogo` y `tienda`)

Basado en el flujo probado de DistribuCG (`docs/distribuidora-pedidos.md` allá), unificado para cualquier rubro.

## Modelo
- `categoria` jerárquica (`padre_id`), nombre único por padre.
- `producto` (familia: nombre, descripción, marca, categoría, imagen, `activo`, `publicado`). Sin precio.
- `variante` (lo que se compra): `producto_id`, `nombre` (null = producto sin variantes), `atributos` JSONB (talle, color, presentación… según rubro), `sku` único, `precio` neto, `precio_anterior`, `iva_porcentaje`, `controla_stock`.
  → Sirve igual para una distribuidora (presentaciones) y para ropa (talle × color): **no se crean tablas por rubro**.
- `producto_imagen` (url Cloudinary, orden, alt).
- `carrito` / `carrito_item` (por usuario; invitado guardado en el navegador y fusionado al iniciar sesión).
- `pedido` (snapshot de datos de entrega + totales) → `pedido_item` (snapshot de nombre, variante, precio, IVA, cantidad) → `pedido_estado_log` (estado anterior/nuevo, motivo, usuario, fecha) → `pedido_cobro` (monto, método, anulado).
- `perfil_cliente`: teléfono, dirección, localidad y provincia obligatorios para pedir; CUIT, razón social y condición IVA opcionales.
- `operacion_idempotente`: guarda el resultado de fusionar carrito / enviar pedido por `clave` (un reintento devuelve lo mismo).

## Publicación del catálogo
- Un producto se ve en la tienda solo si `activo && publicado` y tiene al menos una variante con precio.
- `proyecto.config.js → tienda.catalogo_publico`: si es `false`, hay que iniciar sesión para ver el catálogo.
- Disponibilidad según `controla_stock` y `stock.mostrar_cantidad_en_tienda`: "Disponible" / "Últimas unidades" / "Sin stock" (o "Quedan N" si se muestra la cantidad). Los agotados se ven marcados, salvo `stock.ocultar_sin_stock`.
- Precio mostrado según `tienda.precios_con_iva` (calcular con `compartido/reglas/dinero.js`).
- SEO básico: slug por producto, título y descripción, imágenes con `loading="lazy"`.

## Pedidos
- Estados y transiciones configurables en `proyecto.config.js → pedidos` (por defecto `pendiente → en_preparacion → entregado`, `cancelado`), validados con `compartido/reglas/pedido_transiciones.js` en ambos lados. Retroceder/cancelar/reabrir exige motivo.
- **Cobro separado del estado**: sin cobros / parcial / cobrado, derivado de `pedido_cobro`. No se puede cobrar más que el saldo ni cobrar un pedido cancelado.
- Control de concurrencia: al cambiar estado se envía el estado que vio el operador; si cambió, `409`.

## Reglas críticas
1. **El servidor recalcula todo**: precio, IVA, subtotal, total. El navegador solo manda `variante_id` + `cantidad` + datos de entrega.
2. Envío del pedido en **una transacción** (`pedido_servicio.enviarPedido`): bloquear la fila del usuario y las variantes (FOR UPDATE), comparar con lo que el cliente vio (`esperado`: si cambió precio o cantidad → 409 `CARRITO_CAMBIO`), crear pedido + ítems (copia fija), mover stock y vaciar carrito.
3. Idempotencia: el envío y la fusión del carrito llevan una `clave` (UUID) para que un doble click o un reintento no creen dos pedidos.
4. **Stock por fase del pedido** (`compartido/reglas/pedido_stock.js`): al recibirlo se **reserva**; al pasar a "En preparación" se **descuenta** (con `descontar_en: "confirmacion"`); cancelar libera lo reservado o devuelve lo descontado. Siempre con `registrarMovimientos()` de `modulos/stock/movimientos.js`.
5. Los pedidos nunca se borran; solo cambian de estado.
6. Un cliente solo ve sus pedidos; admin/staff ven todos.
7. Límites de carrito (máx. líneas, máx. cantidad, días de vida) en `proyecto.config.js`.

## Frontend
- Carrito: `hooks/use_carrito.js` es el ÚNICO punto de entrada, con o sin cuenta. El invitado guarda solo `variante_id + cantidad` en `localStorage` (clave por cliente) y pide los precios a `POST /tienda/carrito/cotizar`; al iniciar sesión `sincronizar_carrito` lo fusiona con el de la cuenta.
- El módulo tienda se engancha al resto sin importarlo: `navbarExtras` (ícono del carrito), `accionesProducto` ("Agregar al pedido" en el detalle), `enlacesCuenta` (Mis pedidos, Mis datos), `globales` (sincronizar carrito).
- Al abrir el carrito, avisar si cambió un precio, se quedó sin stock o se desactivó un producto.
- Checkout: carrito → (ingresar o crear cuenta) → datos de entrega (se guardan en el perfil) → envío o retiro → enviar. Mostrar siempre los totales que devuelve el servidor.
