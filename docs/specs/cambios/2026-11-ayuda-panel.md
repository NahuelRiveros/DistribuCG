# Cambio: Ayuda en el panel (guía del sistema)

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-20 | [core/ayuda.md](../core/ayuda.md) |

## Por qué

El panel tiene cada vez más funciones (artículos, familias y categorías, marcas, precios, listas regionales,
actualizar precios con la lista del cliente, ajuste masivo, importación, pedidos, cobros, permisos, respaldo). Quien
lo usa necesita una guía a mano para entender qué hace cada cosa y cómo se hace, sin preguntarle al programador:
"¿qué pasa si un precio viene en 0?", "¿cómo armo una familia?", "¿por qué no veo un artículo en la tienda?".

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| AYU-01 | En el panel, un ítem **"Ayuda"** (ícono de signo de pregunta), al final del menú lateral. Lo ve **solo quien tiene acceso al panel** (el mismo `accesoPanel` del menú: super admin, admin, gerente/supervisor, vendedor y roles creados con algún permiso del panel). Un cliente no la ve, y si entra a `/panel/ayuda` recibe el mismo trato que cualquier pantalla del panel sin permiso (PAN-04). Abre `/panel/ayuda`. | 🚧 |
| AYU-02 | La página muestra los **temas agrupados** (por ejemplo: Primeros pasos, Catálogo, Precios, Pedidos y cobros, Personal y permisos, Respaldo) y un **buscador** que filtra por título y contenido mientras se escribe, sin distinguir acentos ni mayúsculas. Sin resultados: "No encontramos ayuda sobre eso" y la lista completa de temas. | 🚧 |
| AYU-03 | Cada tema es una **guía corta** en lenguaje simple: qué es, para qué sirve, pasos para hacerlo, un ejemplo con números cuando hay cálculos, errores comunes con su solución y "Relacionado" (enlaces a otros temas y a la pantalla donde se hace). | 🚧 |
| AYU-04 | **Cada uno ve solo la ayuda de lo que puede usar**, con los mismos roles y permisos que el menú (`cumpleAcceso`), en todos lados: (a) la lista de temas; (b) el **buscador**, que nunca encuentra un tema oculto; (c) las **secciones dentro de un tema** que piden otro permiso (por ejemplo, en "Pedidos" el paso de registrar un cobro solo aparece con `cobros.gestionar`); (d) los enlaces "Relacionado", que solo apuntan a temas visibles; (e) la **dirección directa** de un tema sin permiso, que muestra "Esta ayuda es para otra función del panel" y vuelve a la lista; y (f) el botón "?", que solo aparece en pantallas que esa persona ya puede abrir. Si cambian sus permisos, la ayuda cambia con ellos al volver a entrar. Ej.: un vendedor ve Primeros pasos, Pedidos y Lista de carga; no ve Precios, Permisos, Importación ni Respaldo. | 🚧 |
| AYU-05 | **Ayuda en contexto:** las pantallas principales (Artículos, ficha del artículo, Familias y categorías, Marcas, Actualizar precios, Ajuste masivo, Importación, Listas de precios, Pedidos, Personal y permisos) tienen un botón "?" que abre su tema directo. | 🚧 |
| AYU-06 | Cada tema tiene **su propia dirección** (`/panel/ayuda/<tema>`) para compartirlo ("mirá esto: …"), y el navegador vuelve atrás normalmente. | 🚧 |
| AYU-07 | Los temas son **contenido del proyecto, no de la base**: viven en archivos del código (el core trae los suyos: panel, personal, permisos; el rubro, los de la distribuidora), así se versionan con los cambios y no gastan consultas. No se editan desde el panel. | 🚧 |
| AYU-08 | **Al día con las reglas:** cada tema indica las reglas que explica (por ejemplo `PRE-34`, `CAT-62`). Un test comprueba que cada código citado exista en las specs y que cada tema tenga título, grupo, contenido y una pantalla o permiso de referencia; así una regla que cambia obliga a revisar su ayuda. | 🚧 |
| AYU-09 | Se lee bien en **celular** (una columna, buscador arriba) y con teclado; los temas cargan sin esperar al servidor. | 🚧 |

### Temas iniciales (distribuidora)

| Grupo | Temas |
| --- | --- |
| Primeros pasos | Cómo está organizado el panel · Tienda vs. panel (por qué el personal ve la tienda como un cliente) |
| Catálogo | Artículos y presentaciones · Familias y categorías · Marcas · Unidades y bultos (Equival) · Por qué un artículo no aparece en la tienda (oculto, sin precio, $0) · Fotos de los artículos · Importar artículos desde Excel |
| Precios | Precio final, IVA y neto · Precio desde el costo y rentabilidad · Ofertas (precio anterior) · Listas regionales · Actualizar precios con la lista del cliente (revisión, precios en 0, deshacer) · Ajuste masivo · Avisos de precio por debajo del costo |
| Pedidos y cobros | Estados del pedido · Cobros y comprobantes · Lista de carga |
| Personal y permisos | Roles y permisos · Crear personal |
| Respaldo | Descargar respaldo del catálogo y restaurar fotos |

**Fuera de alcance:** editar la ayuda desde el panel, videos, chat de soporte, ayuda para los clientes de la tienda
(se puede sumar después como "Preguntas frecuentes").

## Diseño

- **Core** (`frontend/src/core/modules/ayuda/`): página `/panel/ayuda` y `/panel/ayuda/:tema`, buscador, filtro por
  acceso (`cumpleAcceso`) y el botón "?" reutilizable (`BotonAyuda tema="..."`). Ítem "Ayuda" en
  `core/config/navbar_config/panel_gestion.js`.
- **Contenido:** temas del core en `frontend/src/core/modules/ayuda/temas_core.js`; los del rubro en
  `frontend/src/modules/eccomerce_distribuidora/ayuda/temas.js`, registrados en su `modulo.js` (el core no importa el
  rubro). Cada tema: `{ id, grupo, titulo, resumen, reglas: [...], acceso: { permisos, roles }, pantalla, secciones }`,
  con el texto en JS plano (párrafos, pasos, ejemplo, errores comunes).
- **Servidor y base:** sin cambios.
- **Pruebas:** test de Node (AYU-07, AYU-08) que recorre los temas; Playwright: menú, buscador, filtro por rol,
  botón "?" y celular.

## Tareas

1. [x] Aprobar esta spec (2026-11-20).
2. [x] Tests de AYU-01 a AYU-09.
3. [x] Página, buscador, botón "?" e ítem del menú (core).
4. [x] Temas iniciales del core y de la distribuidora.
5. [x] Botón "?" en las pantallas de AYU-05.
6. [x] Verificación completa y capturas en escritorio y celular.
7. [x] Crear `core/ayuda.md` con las reglas y marcar este cambio como hecho.

## Preguntas abiertas

Ninguna.
