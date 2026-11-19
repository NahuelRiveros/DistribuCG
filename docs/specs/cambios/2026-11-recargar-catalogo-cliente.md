# Cambio: limpiar los artículos y recargar el catálogo del cliente desde el panel

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-19 | [eccomerce_distribuidora/catalogo.md](../eccomerce_distribuidora/catalogo.md) |

## Por qué

La base de producción tiene artículos de varias cargas (demostración, importación de octubre con ~10 precios mal
tomados, cambios a mano). Se quiere empezar limpio: borrar todos los artículos y volver a cargar el catálogo como
réplica del Listado de Artículos del cliente (mismos códigos), con sus fotos. Se hace desde el panel, como super
admin, sin depender de scripts que escriban en producción desde la PC.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CAT-52 | En el panel, solo el **super admin** ve "Mantenimiento del catálogo", con dos acciones: "Limpiar artículos" y "Cargar catálogo del cliente". El servidor rechaza a cualquier otro rol. | ✅ |
| CAT-53 | "Limpiar artículos" muestra antes cuántos artículos, presentaciones, renglones de carritos, precios especiales regionales y renglones de pedidos se van a tocar, y ofrece **descargar una copia** (CSV con código, nombre, categoría, marca, precio, bulto y foto). Para confirmar hay que escribir `BORRAR ARTÍCULOS`. | ✅ |
| CAT-54 | Al confirmar, en una sola operación (todo o nada): se vacían los carritos, se borran los precios especiales regionales de esas presentaciones, los **pedidos conservan su copia** (nombre, presentación, precio, IVA: PED-04) pero dejan de apuntar al artículo, y se borran presentaciones, artículos, **categorías y marcas**. Las listas regionales con sus localidades, los clientes y los pedidos **no se tocan**. Las fotos de Cloudinary tampoco. | ✅ |
| CAT-55 | "Cargar catálogo del cliente" solo se puede usar **si no hay ningún artículo vigente**; si ya hay, el botón explica que primero hay que limpiar. Usarlo dos veces no duplica nada. | ✅ |
| CAT-56 | La carga crea cada artículo del Listado del cliente (código, nombre, presentación, marca, Familia › Categoría y unidades por bulto) desde el archivo del catálogo que viene con el sistema (`seed/catalogo_cliente.json`, sin precios), con su foto por código si está en `imagenes_catalogo.json`. Todos entran **ocultos y en $0** (como CAT-43): ninguno se ve hasta tener precio. | ✅ |
| CAT-57 | Después de cargar, la pantalla lleva a "Actualizar precios": la lista del cliente pone los precios y deja a la venta los que tienen precio (PRE-34b). Los que no tienen precio siguen ocultos. | ✅ |
| CAT-58 | Cada limpieza y cada carga queda registrada: quién, cuándo y cuántos artículos. | ✅ |
| CAT-59 | Con `tienda.catalogoInicialAlArrancar: false` (`proyecto/client_config.js`), el arranque no siembra familias, marcas ni productos de demostración en una base sin artículos: limpiar no trae la demo de vuelta en el próximo deploy o reinicio. | ✅ |
| CAT-60 | El mantenimiento entero depende de `tienda.mantenimientoCatalogo`: apagado, no hay página ni menú y el servidor responde 404 a limpiar y cargar, también al super admin. Se apaga apenas producción queda cargada (pedido del dueño: "hay que tener mucho cuidado con esto"). | ✅ |

**Fuera de alcance:** borrar fotos de Cloudinary; borrar categorías, marcas o pedidos; recargar desde el panel
subiendo el Listado en Excel (la limpieza de nombres y las reglas de categoría viven en
`DistribuCG_imagenes/scripts/organizar_catalogo_cliente.mjs`, que genera el archivo de la carga).

## Diseño

- **Datos:** `organizar_catalogo_cliente.mjs` escribe además `servidor/src/modulos/eccomerce_distribuidora/seed/catalogo_cliente.json`
  (sin precios: los precios no van a git) con código, nombre, presentación, marca, categoría y bulto de los ~6.900
  artículos con categoría. Las fotos: `npm --prefix servidor run imagenes:subir -- "../DistribuCG_imagenes/para_cloudinary"`
  completa `seed/imagenes_catalogo.json` (código → URL). Los dos archivos se commitean.
- **API** (`requireRole("super_admin")`, contrato `{ ok, data, mensaje }`):
  - `GET /api/distribuidora/mantenimiento/catalogo`: cantidades de CAT-53 y si se puede cargar (CAT-55).
  - `GET …/catalogo/copia`: CSV de CAT-53.
  - `POST …/catalogo/limpiar` con `{ confirmacion: "BORRAR ARTÍCULOS" }`.
  - `POST …/catalogo/cargar`.
- **Servidor:** `services/mantenimiento_catalogo_service.js`. Limpiar: transacción con `LOCK TABLE` sobre artículos y
  presentaciones (como la importación); `UPDATE nota_pedido_item SET producto_id = NULL, variedad_id = NULL`; `DELETE` de
  carrito, precios regionales, presentaciones y artículos, todo con SQL parametrizado. Cargar: reutiliza
  `buildPlan`/`applyPlan` del importador por lotes de 250 (crea categorías y marcas que falten, CAT-43 para ocultarlos) y
  después asigna fotos con `seed_imagenes_catalogo`. Registro (CAT-58) en `importacion_catalogo` con
  `opciones.tipo = "mantenimiento"`.
- **Pantallas:** panel › Artículos, bloque "Mantenimiento del catálogo" solo para super admin, con las cantidades, la copia,
  el diálogo de confirmación con el texto a escribir, progreso y el enlace a "Actualizar precios". Cargando, error con
  reintentar; en celular, botones de ancho completo.
- **Base de datos:** sin cambios de esquema.

## Tareas

1. [x] Tests: limpiar (pedidos conservan su copia, carritos vacíos, categorías y marcas intactas, rechazo sin la frase y
   para otros roles), cargar (solo con la base sin artículos, ocultos con foto, no duplica), y el recorrido con
   "Actualizar precios".
2. [x] Script: salida `seed/catalogo_cliente.json` sin precios.
3. [x] Servidor y frontend.
4. [x] `node scripts/verificar.mjs --completo`.
5. [ ] En producción (lo hace el dueño): deploy → subir fotos → Limpiar (con copia) → Cargar → Actualizar precios.

## Riesgos

- **Es irreversible.** La copia CSV permite ver qué había, no restaurarlo con un clic. Antes de limpiar conviene hacer un
  respaldo desde Supabase.
- **Pedidos viejos:** siguen completos (tienen su copia), pero "Cancelar y volver a armar" (PED-32) ya no puede devolver
  esos productos al carrito, y en la lista de carga esos renglones salen sin código ni bulto.
- **Clientes con carrito:** lo encuentran vacío.
- **Render gratis:** la carga de ~6.900 artículos va por lotes para no cortar el pedido por tiempo.

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-19 | Los pedidos viejos conservan su copia y se les corta el vínculo con el artículo. | Dueño del proyecto |
| 2026-11-19 | Al limpiar se borran también categorías y marcas: la carga las arma de nuevo con el catálogo del cliente. | Dueño del proyecto |
| 2026-11-19 | Todo entra oculto y en $0; los precios y la visibilidad los pone "Actualizar precios" con la lista del cliente (los precios no van a git). | Dueño del proyecto |
| 2026-11-19 | La carga inicial de demostración del arranque se apaga en esta instalación (CAT-59). | Dueño del proyecto |

## Preguntas abiertas

Ninguna.
