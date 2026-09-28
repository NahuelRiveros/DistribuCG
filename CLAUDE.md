# CLAUDE.md — Contexto raíz del proyecto

Plantilla base reutilizable para proyectos web de clientes: **e-commerce, control de stock y
publicación de catálogo**. Cada cliente nuevo se arma activando módulos y cambiando su
configuración (marca, Home, navbar, footer); el resto del código es común.

Se construye desde cero tomando lo que funciona del proyecto anterior **DistribuCG**
(`C:\Users\nahue\OneDrive\Documentos\GitHub\DistribuCG`) — ver `docs/ORIGEN_DISTRIBUCG.md`.
Este archivo es la **fuente de verdad**: si algo de DistribuCG contradice estas reglas, ganan estas reglas.

## Stack

| Capa        | Tecnología                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Lenguaje    | **JavaScript (ESM, `"type": "module"`). NO usar TypeScript.**              |
| Frontend    | `frontend/` — Vite + React 19 + Tailwind CSS 4 + React Router 7            |
| Datos (web) | TanStack Query + axios (`src/api/http.js`)                                 |
| Formularios | React Hook Form + Zod (`@hookform/resolvers/zod`)                          |
| Backend     | `servidor/` — Node 22 + Express 5                                          |
| Validación  | Zod en ambos lados; schemas compartidos en `compartido/schemas/`           |
| Base datos  | PostgreSQL 17 (local en desarrollo, Neon en producción) + Sequelize 6 + **migraciones con Umzug** |
| Imágenes    | Cloudinary                                                                 |
| Tests       | Vitest + Supertest (servidor), Vitest + Testing Library (web), Playwright (E2E) |
| Deploy      | Render (API) + Neon (Postgres) + Vercel o mismo origen (web)               |

## Estructura

```
proyecto.config.js          # ÚNICO switch del proyecto: cliente activo + módulos on/off + reglas de negocio
compartido/                 # lo que leen frontend Y servidor (sin secretos)
  schemas/                  # schemas Zod (producto, pedido, stock...) reutilizados en ambos lados
  reglas/                   # reglas puras: transiciones de pedido, cálculo de precios/IVA
frontend/src/
  clientes/<id>/            # TODO lo propio de un cliente: marca, tema, logos, home, navbar, footer
  app/                      # router (con errorElement por zona → error_page), providers
  modulos/registro.js       # lista de módulos del frontend (se filtran por proyecto.config.js)
  modulos/<modulo>/         # catalogo, stock, tienda... con modulo.jsx, api/, hooks/, admin/ (panel), tienda/ (público)
  componentes/admin/        # panel de administración: admin_layout (menú lateral), panel_inicio_page
  componentes/sistema/      # aviso_servidor (API dormida o caída)
  componentes/ui/           # primitivas genéricas (input_field, data_grid, modal, confirm_dialog)
  componentes/layout/       # app_layout, navbar (+ menu_cuenta en escritorio, menu_lateral en celular), footer
  api/http.js               # instancia axios compartida
  utils/                    # formatear_dinero, formatear_fecha, normalizar_texto
servidor/src/
  modulos/<modulo>/         # UNA carpeta por módulo, con todas sus capas:
    <entidad>_modelo.js     #   modelo Sequelize (defineModel)
    <entidad>_servicio.js   #   lógica de negocio + transacciones (ÚNICO lugar que usa modelos)
    <entidad>_controlador.js#   HTTP -> servicio (sin lógica, sin try/catch)
    <entidad>_rutas.js      #   router Express + middlewares (auth, rol, validar)
    <entidad>.test.js
  nucleo/                   # errores, manejador_errores, validar, auth, env, db, paginación
  migraciones/              # AAAA_MM_DD_HHMM_descripcion.js (Umzug), historial versionado
  seeds/
```

**Dos zonas en el frontend**: la **tienda** (`/`, navbar y footer del cliente) y el **panel** (`/admin`, menú lateral propio, solo admin/staff/super_admin). Cada módulo declara en `modulos/<m>/modulo.jsx` lo que aporta: `navbar`, `navbarExtras` (ej. carrito), `enlacesCuenta`, `globales`, `accionesProducto` (ej. "Agregar al pedido"), `rutasPublicas`, `rutasAdmin`, `menuAdmin` (su sección del menú lateral; con `submenu: { raiz }` aparece como un solo ítem y al entrar el menú muestra solo sus pestañas + "Volver al panel", como Caja) y `resumenAdmin` (tarjetas del inicio del panel). Los del núcleo (ej. `usuarios`) llevan `siempre: true` y no se apagan. Un módulo nunca importa pantallas de otro módulo de negocio: se conectan por estos puntos. Las pantallas se cargan con `lazy`.

**Regla de módulos**: un módulo apagado en `proyecto.config.js` no registra rutas, no muestra
navbar/pantallas y sus tablas no se usan. Un módulo = una carpeta en `servidor/src/modulos/` y
otra en `frontend/src/modulos/`; borrar ambas carpetas debe eliminarlo sin romper el resto.

### Módulos de la plantilla

| Módulo      | Contenido                                                              | Depende de |
| ----------- | ---------------------------------------------------------------------- | ---------- |
| `nucleo`    | usuarios, auth, roles, subida de imágenes, Home/navbar/footer (siempre activo). Panel: Sistema → Usuarios (solo admin; permisos en `compartido/reglas/usuarios.js`) | —   |
| `catalogo`  | categorías (árbol), productos, variantes, precios/IVA, importación Excel/CSV | nucleo |
| `stock`     | stock por variante, movimientos (kardex), ajustes, alertas de mínimo   | catalogo   |
| `tienda`    | catálogo público, carrito (invitado + cuenta), pedidos, cobros, perfil cliente | catalogo |
| `caja`      | ingresos y egresos con categoría y medio de pago, calendario, balance anual, Excel. Los cobros de pedidos entran solos (se leen de `pedido_cobro`, no se copian). Solo admin | — (usa tienda si está activa) |
| `pagos_online` | Mercado Pago + webhooks (futuro)                                    | tienda     |

## Comandos (desde la raíz)

```bash
npm install                        # instala raíz + frontend + servidor (workspaces)
copy servidor\.env.example servidor\.env     # primera vez (bash: cp)
copy frontend\.env.example frontend\.env
npm run db:migrar                  # aplica migraciones pendientes (el servidor también lo hace solo al arrancar, ver MIGRAR_AL_INICIAR)
npm run db:migrar:deshacer         # revierte la última migración (solo local)
npm run db:migracion -- nombre     # crea archivo de migración vacío con fecha
npm run db:seed                    # datos base (roles, super admin) — idempotente; también corre al arrancar
npm run dev                        # frontend (http://localhost:5173) + servidor (http://localhost:3001)
npm run dev:web                    # solo frontend
npm run dev:api                    # solo servidor

npm test                           # tests de servidor y frontend
npm run test:api                   # solo servidor (usa el esquema de test: BD_ESQUEMA_TEST)
npm run test:web                   # solo frontend
npm run test:e2e                   # Playwright (levanta su propia API :3101 y web :5175 sobre el schema mi_eccomerce_e2e)
npm run lint                       # ESLint en todo el proyecto
npm run cliente:nuevo -- <id> --nombre "Nombre" [--activar]   # cliente nuevo desde la plantilla
npm run cliente:verificar          # ¿quedó algo [COMPLETAR] o de ejemplo en el cliente activo?
npm run cliente:activar -- <id>    # cambia el cliente activo
```

> Si un comando no existe todavía, el proyecto no está scaffoldeado: usar `/scaffold-proyecto`.

## Definición de "terminado"

1. `npm run lint` y los tests afectados pasan — mostrar la salida real, no suponerla.
2. Tests nuevos para la lógica nueva (caso feliz + al menos un caso de error).
3. Si cambió la base de datos, hay una migración nueva y probada (`db:migrar` y `db:migrar:deshacer`).
4. Sin `console.log` de depuración, sin código comentado, sin archivos en carpetas `sin_usar/`.

---

## Reglas JavaScript (global)

- **JavaScript puro**: no crear `.ts`/`.tsx`, no agregar tipos ni `interface`. El dueño del proyecto no programa en TypeScript; el código tiene que ser simple y legible.
- ESM, `const` por defecto, nunca `var`, `async/await`, `===`, `?.` y `??`.
- **Archivos en `snake_case`** (`producto_card.jsx`, `pedido_servicio.js`), también componentes. Componentes y clases en `PascalCase`, funciones/variables en `camelCase` o `snake_case` siguiendo el archivo vecino.
- Nombres del dominio **en español** (`producto`, `variante`, `pedido`, `movimiento_stock`).
- Funciones con más de 2 parámetros reciben un objeto: `crearPedido({ usuario_id, items, notas })`.
- Comentarios: explicar el **por qué** de las decisiones de negocio, breve. No comentar lo obvio.
- Texto sin acentos (búsquedas, slugs, encabezados): usar `quitarAcentos()` de `compartido/reglas/texto.js`; no escribir rangos Unicode a mano.
- Nada de código muerto: no se crean carpetas `sin_usar/`, `proyecto_futuro/` ni archivos "por las dudas". Si algo se descarta, se borra (queda en git).

## Configuración por cliente

- `proyecto.config.js` (raíz): `cliente` activo, `modulos` on/off, reglas de negocio (estados de pedido, carrito, catálogo público). Lo leen frontend y servidor. **Nunca secretos.**
- **Pagos** (medios con % de descuento que el servidor aplica al pedido, cuotas con/sin interés + CFT, promociones con vigencia, CBU/alias, cinta): se editan en el panel **Configuración** (pestañas Medios de pago · Cuotas · Promociones, las tres sobre el mismo documento) (tabla `configuracion`, cada cambio queda en `configuracion_cambio`). `proyecto.config.js → pagos` son solo los **valores iniciales**. Leer siempre con `obtenerPagos()` (servidor) o `usePagos()` (web), nunca `proyecto.pagos` directo; los cálculos, con `compartido/reglas/pagos.js` pasando esa config. El CBU y el CUIT se validan con dígitos de control (`compartido/reglas/bancarios.js`). Logos en `frontend/src/assets/medios_pago/` (nunca en `dist/`).
- `frontend/src/clientes/<id>/`: `marca.js` (nombre, rubro, tagline, fuentes), `tema.js` (colores), `home.js`, `navbar.js`, `footer.js`, `assets/` (logos). **Home, navbar y footer se configuran solo acá**; los componentes nunca tienen textos, colores ni links de un cliente escritos a mano.
- Un cliente = una carpeta. No se mezclan varios clientes en un mismo objeto.
- **Menú de productos** (`clientes/<id>/navbar.js`): `productos` (nombre de la sección, ej. "Productos"), `menu_productos: "enlace" | "categorias"` (por categorías = las marcadas "Mostrar en el menú" en el panel, con subcategorías desplegables; para indumentaria) y `novedades` / `ofertas`. Un módulo puede aportar al navbar un componente (`{ clave, Componente }`) en vez de un link.
- **Cliente nuevo**: skill `/nuevo-cliente` (guiada). Por debajo usa `npm run cliente:nuevo -- <id> --nombre "..." [--activar]` (copia `clientes/demo`, que es la plantilla y no se edita), `npm run cliente:verificar` (marca `[COMPLETAR]` y datos de ejemplo) y `npm run cliente:activar -- <id>`. Ningún código ni test puede depender de que el cliente se llame `demo`.
- Secretos y URLs de infraestructura solo en `.env` (validado en `servidor/src/nucleo/env.js`). Nombres en español que dicen qué va y de dónde sale (`BD_URL_NEON`, `URL_FRONTEND_VERCEL`, `CLAVE_SESIONES`, `VITE_URL_API_RENDER`…); qué va en Render y en Vercel: `docs/DESPLIEGUE.md`.

## Reglas React (`frontend/`)

- Solo componentes funcionales, un componente exportado por archivo, props desestructuradas con valores por defecto: `function ProductoCard({ producto, onAgregar, compacto = false })`.
- **Nada de fetch/axios en componentes**: toda llamada va en `modulos/<m>/api/<m>_api.js` y se consume con un custom hook de TanStack Query (`use_productos.js`). Nunca `useEffect` + fetch.
- Query keys por módulo (`productoKeys.lista(filtros)`), invalidar lo afectado tras cada mutación.
- Formularios: React Hook Form + `zodResolver` con el **mismo schema de `compartido/schemas/`** que usa el servidor.
- Importar `z` siempre desde `compartido/zod.js` (no desde "zod"): configura los mensajes por defecto en español.
- Siempre los 3 estados: cargando (skeleton/spinner), error (mensaje + reintentar), vacío.
- Reutilizar `componentes/ui/` antes de crear algo nuevo. Componentes > ~200 líneas → dividir.
- Listados: usar `componentes/ui/tabla.jsx` (tabla en pantallas anchas, una tarjeta por fila en celular; en el panel hasta 1024 px porque el menú lateral ocupa lugar). No escribir `<table>` a mano salvo planillas por naturaleza (mapeo de columnas de una importación). En la tarjeta las acciones llevan texto, no solo ícono.
- Tailwind con los tokens del tema (`bg-primario`, `text-texto-suave`, `border-borde`, `text-acento`, `font-titulos`; definidos en `src/index.css`); nunca colores fijos de un cliente.
- Accesible: `label` en inputs, `alt` en imágenes, botones reales, navegable con teclado.
- Dinero siempre formateado con `utils/formatear_dinero.js`.
- Imágenes de productos siempre con `urlImagen(url, ANCHOS.x)` de `utils/imagenes.js` (Cloudinary entrega el tamaño justo); nunca la `url` original en un `<img>`. Solo los anchos de `ANCHOS` (cada tamaño nuevo consume cuota de Cloudinary).
- Pantallas nuevas con `lazy`; librerías pesadas nuevas, en su propio chunk (`vite.config.js → manualChunks`).
- Fechas de calendario (sin hora) como texto `AAAA-MM-DD` con `compartido/reglas/fechas.js`; "hoy" es `hoyEn()` (zona de `proyecto.zona_horaria`), nunca `new Date()` suelto.
- Gráficos: colores `bg-serie-1`, `bg-serie-2` (par validado para daltonismo); verde/rojo quedan para estados. Siempre con leyenda y una tabla con los mismos datos.

## Reglas Node.js (`servidor/`)

- **Capas**: `rutas → controlador → servicio → modelo`.
  - Controlador: toma `req`, llama al servicio y responde. Sin lógica de negocio, **sin try/catch** (Express 5 pasa los errores async al manejador central).
  - Servicio: reglas de negocio y transacciones. Único lugar que importa modelos Sequelize. No sabe nada de `req`/`res`.
- **Validación en la entrada**: toda ruta con body/query/params usa `validar(schema)` de `nucleo/validar.js` (Zod). El controlador recibe los datos limpios en `req.datos.body`, `req.datos.query` y `req.datos.params`.
- **Errores centralizados**: los servicios lanzan `ErrorApp` o sus subclases (`NoEncontrado`, `Conflicto`, `NoAutorizado`, `SinPermiso`, `DatosInvalidos`) de `nucleo/errores.js`. Un único `manejador_errores.js` responde:
  ```json
  { "ok": false, "codigo": "PRODUCTO_NO_ENCONTRADO", "mensaje": "El producto no existe.", "detalles": [] }
  ```
  Errores de Sequelize conocidos (`SequelizeUniqueConstraintError` → 409, FK → 409) se traducen ahí. Nunca se envía el stack ni el mensaje crudo de la base al cliente.
- **Respuestas OK**: `{ ok: true, data }` y en listados `{ ok: true, data, paginacion: { pagina, limite, total, total_paginas } }`. Límite máximo 100.
- Mensajes al usuario en español, claros y sin jerga técnica.
- `process.env` solo se lee en `nucleo/env.js` (validado con Zod al arrancar; en producción, si falta algo, no arranca).
- Auth: JWT en header `Authorization: Bearer`, invalidado si cambia la contraseña (versión de password en el payload). Passwords con `bcryptjs` (costo 10). Roles: `super_admin`, `admin`, `staff`, `cliente`. Middlewares en `nucleo/auth/middlewares.js`: `requerirAuth`, `authOpcional`, `requerirRol(...)`, `requerirModulo("stock")`. Registrar rutas nuevas en `modulos/registro.js`. `super_admin` pasa cualquier `requerirRol`. `authOpcional` ignora tokens vencidos (el visitante sigue navegando).
- Seguridad HTTP: helmet, CORS con lista blanca, rate limit en login, registro, recuperación y envío de pedidos.
- Red: `compression` activo; lecturas públicas con `cachePublico()` de `nucleo/cache.js`; `/api/salud` **no toca la base** (Render la consulta seguido y Neon tiene que poder suspenderse; `?bd=1` para probar la base).
- Archivos subidos: `recibirArchivo()` de `nucleo/archivos.js` (tamaño y extensiones permitidas, errores en español). Imágenes: `nucleo/imagenes.js` (Cloudinary; sin credenciales se aceptan imágenes por URL https).
- Allowlist de campos al crear/actualizar (schema Zod o `pick`), nunca `Modelo.create(req.body)`.
- Todo lo que toca **dinero o stock va en una transacción** (`sequelize.transaction`).

## Reglas PostgreSQL / Sequelize

- **Todo cambio de estructura = migración nueva** en `servidor/src/migraciones/` con `up` y `down`. **Prohibido `sync({ alter: true })` y `sync({ force: true })`**. Nunca editar una migración ya aplicada en otro entorno: crear otra.
- Cambios destructivos (borrar/renombrar columna) en dos pasos: agregar la nueva → migrar datos → borrar la vieja en una migración posterior.
- Nunca reusar el mismo objeto de definición de columna en varios atributos (Sequelize lo modifica): usar una función que devuelva uno nuevo, ej. `const dinero = () => ({ type: DataTypes.DECIMAL(12, 2), allowNull: false })`.
- Modelos con `defineModel()` (`nucleo/db/define_model.js`) y relaciones declaradas como datos con `aplicarRelaciones()`.
- Tablas y columnas en `snake_case` singular (`producto`, `variante`, `movimiento_stock`). Columnas comunes: `creado_en`, `actualizado_en`; borrado lógico con `eliminado_en` en entidades de negocio.
- **Dinero**: `DECIMAL(12,2)`; los cálculos se hacen en centavos enteros con `compartido/reglas/dinero.js` y se redondea una sola vez. Nunca `FLOAT`.
- **Stock**: nunca se pisa la cantidad a mano. Todo cambio pasa por `registrarMovimiento()` / `registrarMovimientos()` de `servidor/src/modulos/stock/movimientos.js` (dentro de una transacción): actualiza el saldo con condición atómica y registra el movimiento. `movimiento_stock` no se puede modificar ni borrar (trigger en la base). Ver skill `dominio-inventario`.
- **Índices**: toda FK con índice; índices en columnas de filtro/orden frecuentes; `UNIQUE` para SKU, email, slug (parciales `WHERE eliminado_en IS NULL` si hay borrado lógico); `pg_trgm` para búsqueda por texto en productos.
- Constraints en la base, no solo en el código: `NOT NULL`, `UNIQUE`, `CHECK (cantidad >= 0)`, FKs con `ON DELETE` explícito.
- **SQL injection**: usar la API de Sequelize. Si hace falta SQL crudo: `sequelize.query(sql, { replacements: { ... } })` o `bind`. **Prohibido interpolar valores del usuario con `${}` en SQL**. Nombres de columnas para ordenar: solo desde una lista blanca.
- Búsquedas "contiene": usar `patronContiene(q)` de `nucleo/consultas.js` (escapa `%` y `_`).
- Árboles (categorías): consultas `WITH RECURSIVE` en una sola query, no recorridos en JS.
- Evitar N+1: `include` con `attributes` explícitos; nunca traer columnas sensibles (`contrasena`).
- Seeds idempotentes (`findOrCreate` / `upsert`).

## Seguridad (no negociable)

- Nunca commitear `.env` ni credenciales; solo `.env.example` con valores falsos. **No leer ni mostrar el contenido de `.env`.**
- El servidor valida permisos aunque el frontend oculte el botón. Un cliente solo ve SUS pedidos.
- Precios, IVA y totales se recalculan siempre en el servidor; nunca se confía en el precio que manda el navegador.
- Variables `VITE_*` son públicas: nunca poner secretos ahí.

## Forma de trabajar del agente

- Features en orden: **Base de datos (migración + modelo) → schemas compartidos → servidor → frontend → E2E**. Mostrar el plan antes de tocar más de 5 archivos.
- Para traer algo de DistribuCG usar `/traer-de-distribucg`: se lee el original, se adapta a estas reglas y se descarta lo específico de gym/kinesiología/indumentaria.
- Buscar primero si ya existe un componente, hook o servicio reutilizable.
- Cambios mínimos y enfocados; no refactorizar código no relacionado sin pedirlo.
- Reglas de negocio ambiguas (precios, IVA, stock, estados): **preguntar**, no inventar.
- Explicar en español simple lo que se hizo; el dueño del proyecto está aprendiendo.
