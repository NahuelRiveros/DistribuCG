# Cambio: separar el core en una carpeta propia y en el repo CoreSistem

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha (rama `separar-core`) | Nahuel | 2026-11-10 | [README de specs](../README.md) |

## Por qué

Cada proyecto nuevo (otro rubro, otro cliente) vuelve a necesitar lo mismo: ingreso, usuarios, roles y
permisos, panel, diseño, controles, carrito genérico, importación, pruebas y despliegue. Hoy eso está
mezclado con la distribuidora. La idea es tenerlo como un "framework" propio:

- todo lo reutilizable vive en una carpeta `core/` (en el frontend y en el servidor);
- lo que cambia por cliente vive en una carpeta `proyecto/`, pocos archivos y fáciles de encontrar;
- el negocio vive en su carpeta de rubro (hoy `eccomerce_distribuidora`);
- el core se sube además a https://github.com/NahuelRiveros/CoreSistem.git, y a ese repo **solo** van
  los archivos del core.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| COR-01 | Ningún archivo del core (`core/`, `frontend/src/core/`, `servidor/src/core/`) importa un rubro: los recibe por los registros de `proyecto/` (`modulos_activos.js`, `pantallas_modulos.jsx`, `modulos.js`, `gate_config.js`, `permisos_rubros.js`). Lo del cliente lo lee solo de `proyecto/`. | ✅ `core_estructura.test.mjs` › "COR-01…" |
| COR-02 | Todo lo que identifica al cliente (nombre, logos, colores, textos del inicio y del footer, URLs, carpeta de Cloudinary, datos de cobro y fiscales, tablas retiradas) está en `proyecto/`. | ✅ revisado a mano (búsqueda de nombres del cliente en el core) |
| COR-03 | DistribuCG funciona igual que antes de mover: tests del servidor, lint, build y Playwright en verde, sin cambios de base de datos. | ✅ 70 tests, lint, build y 99 Playwright; la integración corre en GitHub Actions |
| COR-04 | El repo CoreSistem recibe solo lo de `core_lista.txt`; nunca `proyecto/`, los rubros, `.env` reales, logos ni documentos del cliente, aunque la lista los habilite por error. | ✅ `core_estructura.test.mjs` › "COR-04…" (2 tests) |
| COR-05 | Un proyecto nuevo arranca copiando CoreSistem y corriendo `scripts/nuevo_proyecto.mjs` (copia `plantilla_proyecto/`); sin rubro instalado, tests, lint y build pasan y el inicio y el ingreso se ven. | ✅ `core_estructura.test.mjs` › "COR-05…" + prueba manual en carpeta aislada con capturas |
| COR-06 | Los dos repos se mantienen desde la misma carpeta: un segundo git (`.git-core/`) sube a CoreSistem solo lo de `core_lista.txt` ya commiteado, con `node scripts/core_subir.mjs` (muestra los cambios; `--subir` sube). | ✅ |
| COR-07 | La facturación electrónica (ARCA: `core/fiscal_config.js`, `arca.js`, `services/facturacion/`) es parte del core, apagada por configuración; los datos de quien factura están en `proyecto/client_config.js` (`emisorFiscal`). | ✅ `ux_rules.test.mjs` › "fiscal…" y "ARCA…" |

**Fuera de alcance:** cambiar comportamiento o diseño mientras se mueve; renombrar tablas; publicar
paquetes npm (el core se copia, no se instala).

## Inventario: qué va a cada lugar

Relevado el 2026-11-10 sobre la rama `articulos-en-categorias`. "Ajuste" = hoy tiene un dato del
rubro o del cliente que hay que sacar antes de moverlo.

### Frontend → `frontend/src/core/`

| Hoy | Qué es | Ajuste |
| --- | --- | --- |
| `controls/ui/` (22), `controls/layout/` (navbar, panel, footer), `controls/acceso/`, `controls/brand/`, `controls/modales/`, `controls/toast/`, `controls/sistema/`, `controls/suscripcion/`, `controls/config/`, `controls/version.js`, `controls/CHANGELOG.md` | componentes y marco de pantallas | el footer y `index.css` solo tienen comentarios de la distribuidora |
| `controls/carrito/`, `controls/catalog/`, `controls/importacion/` | carrito, tarjeta de producto e importación genéricos (decisión ya tomada: son core) | — |
| `controls/pedidos/` | resumen y formato del pedido, formulario de cobro | `order_summary.jsx` importa `order_config` (rubro): que lo reciba por props |
| `hooks/` (`use_crud_page`, `use_home_config`, `use_home_content`) | hooks reutilizables | — |
| `api/` (todos: `http`, `api_url`, `auth`, `permisos`, `staff`, `suscripcion`, `ubicacion`, `upload`, `health`, `modulos`, `home_content`, `banner_anuncio`, `_scaffold_entidad_api`) | cliente HTTP y APIs del core | `api_url.js` lee `deployment_config` → pasa a `proyecto/` |
| `auth/auth_context.jsx` | sesión | — |
| `app/` (`router.jsx`, `query_client.js`, `routes/*`) | rutas del core | — |
| `modules/usuarios/`, `modules/panel/`, `modules/home/`, `modules/_scaffold/` | pantallas del core y molde de rubro | `home_config` tiene un enlace a `/distribuidora/catalogo` → `proyecto/` |
| `utils/` (`cn`, `formatear_fecha`, `normalizar_texto`) | utilidades | — |
| `config/theme_config.js`, `config/auth_config.js`, `config/navbar_config/` (main, panel_gestion, `_scaffold`) | estructura de tema, ingreso y menús | `navbar_config/main.js` solo comenta la distribuidora |
| `main.jsx`, base de `index.css` | arranque y estilos base | la paleta de colores pasa a `proyecto/` |

### Frontend → `frontend/src/proyecto/` (lo que se toca en cada cliente)

`config/brand_config.js`, `config/logo_config.js`, `config/home_config.js`, `config/footer_config.js`,
`assets/` (logos), la paleta de `index.css`, y los registros `modules/modulos_activos.js` y
`modules/pantallas_modulos.jsx` (dicen qué rubros hay instalados).

### Frontend → queda en el rubro

`modules/eccomerce_distribuidora/` completo y los re-export `config/order_config.js` y
`config/catalog_import_config.js`.

### Servidor → `servidor/src/core/`

| Hoy | Qué es | Ajuste |
| --- | --- | --- |
| `app.js`, `server.js` | arranque | leen `deployment_config` → `proyecto/` |
| `configuracion_servidor/env.js`, `cloudinary.js`, `gate_config.js` | entorno | `env.js` nombra seeds del rubro en comentarios |
| `routes/`, `controllers/`, `services/`, `models/` de `usuarios`, `sistema`, `home`, `ubicacion`, `common`, `upload`, `_scaffold` | todo el core en capas | — |
| `services/common/` (auth_tokens, contraseña, mails, CRUD, paginación, consultas, subida, Google, importación…) | lógica compartida | `cart_rules.js` lee `clientConfig.distribuidora`: renombrar a `clientConfig.carrito` |
| `middleware/` (auth, módulo, suscripción) | autorización | — |
| `database/` (`sequelize`, `bootstrap`, `schema_hash`, `ubicacion/`, `seed/`) | conexión, arranque y seeds del core | `seed_catalogos.js` y la lista `TABLAS_RETIRADAS` del bootstrap tienen datos de esta instalación → se pasan al rubro o a `proyecto/` |

**Queda en el rubro:** `modulos/eccomerce_distribuidora/`. **Proyecto:** `modulos/index.js` (registro).

### Raíz del repo

| Archivo | Destino | Ajuste |
| --- | --- | --- |
| `permisos_config.js` | core | el bloque `RUBRO_DISTRIBUIDORA` se muda al rubro y lo suma el registro |
| `client_config.js` | partir | `auth` → core (valores por defecto); `distribuidora` y `transferencia` → rubro/`proyecto/` |
| `gate_config.js`, `deployment_config.js` | proyecto | — |
| `fiscal_config.js` (+ `arca.js`, `services/facturacion/`) | core (COR-07) | los datos del emisor (`emisor`) pasan a `proyecto/` |
| `order_config.js`, `unidades_config.js`, `catalog_import_config.js` | rubro | — |
| `scripts/verificar.mjs`, `verificar_env.mjs`, `analizar_modulos.mjs`, `.githooks/`, `.github/workflows/`, `.nvmrc`, `.gitignore`, `*.env.*.example` (con valores falsos) | core | el workflow y los ejemplos no deben nombrar a DistribuCG |
| `frontend/` y `servidor/`: `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`, `tailwind.config.js`, `playwright.config.js`, `index.html`, `vercel.json` | core (esqueleto) | nombre y título del paquete → `proyecto/` o genérico |
| `CLAUDE.md`, `frontend/CLAUDE.md`, `.claude/agents/`, `.claude/skills/` (menos `dominio-distribuidora`) | core, versión genérica | — |
| `docs/specs/README.md`, plantillas, `docs/specs/core/` | core | — |
| Tests: `servidor/tests/`, `frontend/tests/browser/` | partir | los de usuarios, permisos, panel, sesión → core; los de catálogo, carrito y pedidos → rubro |
| `Contrato_Moovs.pdf`, `frontend/prompStylos.txt`, `docs/` del rubro | nunca a CoreSistem | — |
| `docs/facturacion-arca.md` | core | — |

## Diseño (cómo quedó)

- **Estructura:** tres partes repetidas en tres lugares. Raíz: `core/` (permisos, fiscal, límites de
  importación), `proyecto/` (gate, client, deployment, permisos de rubros) y `rubros/eccomerce_distribuidora/`
  (pedidos, unidades, importación). Frontend: `src/core/`, `src/proyecto/`, `src/modules/<rubro>/`. Servidor:
  `src/core/`, `src/proyecto/`, `src/modulos/<rubro>/`. Quedan afuera de `core/` solo los puntos de entrada
  fijos: `frontend/src/main.jsx`, `index.css` y `servidor/src/server.js`.
- **Imports relativos, sin alias:** el script de la mudanza los reescribió todos; un alias de Vite no sirve para
  el servidor ni para los tests de Node, que leen los mismos archivos.
- **Lista del core en `core_lista.txt`, no en un `.gitignore`:** los `.gitignore` de `frontend/` y `servidor/`
  tienen excepciones (`!.env.*.example`) que mandan sobre un `.gitignore` de lista permitida y habrían subido
  el `.env.produccion.example` con las URLs del cliente. La lista se escribe igual que un `.gitignore` pero al
  revés (todo afuera salvo `!`), la lee `scripts/core_lista.mjs` y además bloquea `proyecto/`, rubros y `.env`.
- **Base de datos:** sin cambios. **Pantallas:** sin cambios visibles en DistribuCG.

## Pendiente (no bloquea)

- Tests mezclados: `ux_rules.test.mjs` y `checkout.integration.mjs` prueban core y rubro juntos; separarlos para
  que CoreSistem tenga sus propios tests de usuarios, permisos y panel. Hasta entonces CoreSistem no lleva
  `.github/workflows/` (correría tests que no tiene).
- `CLAUDE.md` y los skills de `.claude/` todavía nombran a DistribuCG: hacer una versión genérica para el core.
- El schema por defecto (`gc_dist_test` en `core/database/sequelize.js`) es de esta instalación; en un proyecto
  nuevo se define con `DB_SCHEMA`.
- El componente del logo se sigue llamando `LogoMoovs` (nombre heredado; renombrarlo toca 4 archivos).

## Preguntas

1. **¿Cómo mantener los dos repos?**
   - a) **(Recomendada)** Segundo repo git en la misma carpeta con lista permitida + script `core:subir`.
     Simple, un solo lugar de trabajo; hay que subir con el script, no con `git push` a secas.
   - b) Copiar `core/` a una carpeta aparte con un clon de CoreSistem y commitear ahí. Más manual.
   - c) `git subtree`: exige que todo el core esté en una sola carpeta raíz, y hoy está repartido entre
     frontend y servidor.

   **Respuesta:** a) (Nahuel, 2026-11-10).
2. **Facturación ARCA (`fiscal_config.js`, `arca.js`, `services/facturacion/`): ¿core o rubro?** Está
   documentada, no programada. Recomendación: core opcional, apagado por configuración, porque cualquier
   negocio argentino la va a necesitar.

   **Respuesta:** core (Nahuel, 2026-11-10). Los datos fiscales de cada cliente van en `proyecto/`.

## Tareas

1. [x] Responder las preguntas y aprobar esta spec.
2. [x] Mover con un script que reescribe los imports (250 archivos) y verificar: sin cambios de comportamiento.
3. [x] Ajustes: permisos de rubros a `proyecto/permisos_rubros.js`, `emisorFiscal` y `tienda` en `client_config.js`,
   límites de importación a `core/importacion_config.js`, tablas retiradas, colores, carpeta de Cloudinary,
   nombre del sistema y logo del cliente anterior fuera del core.
4. [x] Tests COR-01, COR-04 y COR-05 (`servidor/tests/core_estructura.test.mjs`).
5. [x] `plantilla_proyecto/` y `scripts/nuevo_proyecto.mjs`.
6. [x] `core_lista.txt`, `scripts/core_subir.mjs` y primera subida a CoreSistem.
7. [x] Prueba de COR-05 en una carpeta aislada: tests, lint, build y capturas del inicio y el ingreso.
8. [x] `README.md`, `CLAUDE.md`, `frontend/CLAUDE.md` y rutas en las specs.

## Riesgos

- Mover cientos de archivos rompe imports: se hace por partes, con build y Playwright después de cada una.
- Un archivo del cliente o un secreto subido a CoreSistem por error: la lista permitida y el script
  muestran los archivos antes de subir; los `.env` reales siguen fuera de los dos repos.
- Ramas abiertas (`articulos-en-categorias`, `specs-pendientes`): conviene mezclarlas a `main` antes de
  mover, para no tener conflictos enormes.
