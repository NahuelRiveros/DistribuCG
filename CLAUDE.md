# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## DistribuCG

Guía de trabajo para Claude Code en este repositorio. Adaptada de `../dynamic-gym`
a la estructura y los comandos reales de DistribuCG. Las instrucciones explícitas
del usuario tienen prioridad; no volver a pedir una autorización ya otorgada.

## Proyecto y fuentes de verdad

Distribuidora con catálogo, presentaciones de productos, carrito invitado y de cuenta,
notas de pedido, cobros manuales e importación de productos.
El proyecto es solo distribuidora: gimnasio, kinesiología, indumentaria, stock/kiosco y
`proyecto_futuro` se eliminaron. El bootstrap borra las tablas viejas de los rubros retirados
en cada arranque (`servidor/src/proyecto/tablas_retiradas.js`); no volver a agregar código
de esos rubros.

**Core, proyecto y rubro** (spec `docs/specs/cambios/2026-11-separar-core.md`): lo reutilizable vive en
`core/` (raíz, compartido), `frontend/src/core/` y `servidor/src/core/`; lo de este cliente en `proyecto/`,
`frontend/src/proyecto/` y `servidor/src/proyecto/`; el negocio en `rubros/eccomerce_distribuidora/` (config
compartida), `frontend/src/modules/eccomerce_distribuidora/` y `servidor/src/modulos/eccomerce_distribuidora/`.
El core nunca importa un rubro (test COR-01); lee lo del cliente solo de `proyecto/`. El core se sube además a
https://github.com/NahuelRiveros/CoreSistem.git con `node scripts/core_subir.mjs` y se traen las mejoras hechas allá con
`node scripts/core_traer.mjs` (`--subir`/`--traer` para hacerlo; solo
lo de `core_lista.txt` ya commiteado). `plantilla_proyecto/` es el `proyecto/` genérico que copia
`scripts/nuevo_proyecto.mjs` en un proyecto nuevo: si se agrega un archivo a `proyecto/` que el core lee,
sumar su versión genérica a la plantilla.

- `proyecto/gate_config.js`: módulos de la instalación; solo `eccomerce_distribuidora` está activo.
  Frontend (`core/config/gate_config.js`) y servidor (`core/configuracion_servidor/gate_config.js`) re-exportan este mismo
  archivo. Decide qué tablas crea el bootstrap; no cambiarlo como un simple ajuste visual.
- `proyecto/client_config.js`: cliente activo, acceso público, políticas de la tienda y el carrito (`tienda`),
  datos de transferencia y datos fiscales de quien factura (`emisorFiscal`).
- `proyecto/deployment_config.js`: nombre, URLs públicas y carpeta de Cloudinary de esta instalación.
- `rubros/eccomerce_distribuidora/order_config.js`: estados, transiciones, stock por estado y comprobantes de cobro.
- `core/permisos_config.js`: lista de TODOS los permisos del personal: los del core ahí y los de cada rubro en
  `proyecto/permisos_rubros.js` (`pedidos.ver`, `cobros.gestionar`, `precios.editar`…), que se suman a la misma lista,
  sus grupos, dependencias (`requiere`) y los roles que los reciben al aparecer (`porDefecto`). Qué rol tiene
  cada permiso vive en la base (`rol_permiso`) y se edita en `/admin/permisos`. `admin` y `super_admin` tienen
  todos siempre. El rol `staff` se renombró a `supervisor` (`renombrarStaffASupervisor` en `seed_rbac.js`).
- `rubros/eccomerce_distribuidora/catalog_import_config.js`: campos de la importación del catálogo; los límites del
  lector (tamaño, filas, tiempo) son del core: `core/importacion_config.js`.
- `core/fiscal_config.js`: condiciones frente al IVA, validación de CUIT/DNI y tipo de factura sugerida; la
  condición de quien factura sale de `proyecto/client_config.js` (`emisorFiscal`, a completar). La facturación con ARCA está documentada, no programada:
  `docs/facturacion-arca.md`; su configuración (variables `ARCA_*`, URLs, estado) está en
  `servidor/src/core/configuracion_servidor/arca.js` y nunca va al frontend. Los precios guardados son FINALES (con IVA); `nota_pedido_item.iva_porcentaje` los desglosa.
- `rubros/eccomerce_distribuidora/unidades_config.js`: unidades de venta, bultos (equivalencia) y el cálculo de bultos/sueltos
  que usan la ficha del artículo, el catálogo y la lista de carga.
- `docs/specs/`: especificaciones (SDD). Reglas con código (`USU-03`…) y su test; antes de programar un
  cambio se escribe y aprueba su spec de cambio. Ver `docs/specs/README.md`.
- `docs/distribuidora-pedidos.md`: contrato y reglas del pedido; leer para cambios de negocio.
- Catálogo en dos niveles (Familia › Categoría). Las marcas son tabla propia (`marca_distribuidora`)
  asociada a familias o categorías (`marca_categoria_distribuidora`); el artículo guarda `marca_id` y
  `producto_distribuidora.marca` es una copia del nombre que mantiene `marcas_distribuidora_service.js`
  (no escribirla a mano). El bootstrap migra marcas en texto viejas (`sincronizarMarcasLegado`).
- Precios: la "General" es `variedad.precio`/`precio_anterior`. Las listas regionales (`lista_precio*`) solo
  guardan excepciones por presentación y aplican por la localidad del perfil del cliente (una localidad, una
  lista). Todo precio que ve o paga un cliente pasa por `listas_precio_service.js` (catálogo, detalle,
  ofertas, carrito y pedido); la gestión ve la General. Oferta = `precio_anterior > precio` de su lista.
- `frontend/src/proyecto/config/`: marca, logos, colores (`theme_config.js`), inicio y footer del cliente.
  `frontend/src/core/config/`: navegación e ingreso.
- Ante diferencias entre comentarios y código, comprobar rutas, servicios y tests antes de concluir.

## Stack y estructura

JavaScript ESM y JSX; no introducir TypeScript. React 19, Vite, Tailwind 4,
React Router, TanStack Query, axios, React Hook Form y Zod en el frontend.
Express 5, Sequelize 6 y PostgreSQL en el servidor. Zod no está instalado en el backend.

```text
core/                              core compartido por frontend y servidor: permisos, fiscal, límites de importación
proyecto/                          config compartida de este cliente (gate, client, deployment, permisos de rubros)
rubros/eccomerce_distribuidora/    config compartida del rubro (pedidos, unidades, importación)
plantilla_proyecto/                versión genérica de las carpetas proyecto/ para un proyecto nuevo
frontend/src/
  main.jsx, index.css              arranque y estilos base
  core/app/router.jsx, routes/     rutas del core (las del rubro las aporta su módulo)
  core/auth/                       sesión y permisos de interfaz
  core/api/                        cliente HTTP y APIs comunes
  core/controls/                   controles compartidos, layout, carrito, catálogo, importación
  core/controls/layout/panel/      marco del panel de gestión (/panel): menú lateral por rol
  core/controls/ui/                campos, modal, data_grid, confirm_dialog
  core/modules/                    pantallas del core (usuarios, panel, home) y molde _scaffold
  core/hooks/, core/utils/, core/config/   hooks, utilidades, navegación
  proyecto/config/, proyecto/assets/       marca, colores, textos y logos del cliente
  proyecto/modulos_activos.js      registro de rubros: datos (menús, footer, login); lo leen los tests de Node
  proyecto/pantallas_modulos.jsx   registro de rubros: rutas, proveedor, ícono del navbar, resumen del panel, inicio
  modules/eccomerce_distribuidora/ todo el rubro: modulo.js (datos), modulo_pantallas.jsx, rutas.jsx,
                                   menu.js, storefront_config.js, pantallas, API y pedidos/controles/
servidor/src/
  server.js                        arranque con bootstrap/seed
  core/app.js                      app Express
  core/routes/ -> controllers/ -> services/  capas del CORE (usuarios, permisos, sistema, home, ubicación)
  core/services/common/            reglas compartidas y utilidades del core (carrito, mails, paginación)
  core/models/, core/database/     modelos, conexión, bootstrap y seeds del core
  core/middleware/                 autenticación, roles y módulos
  core/configuracion_servidor/     entorno, Cloudinary y ARCA
  proyecto/modulos.js              módulos de rubro instalados (el core solo recorre esta lista)
  proyecto/tablas_retiradas.js     tablas de instalaciones anteriores que borra el arranque
  modulos/eccomerce_distribuidora/
    modulo.js                      manifiesto: modelos en orden, rutas, arranque y seed
    models/index.js                modelos y relaciones del rubro (re-exporta los del core)
    routes/ controllers/ services/ seed/   todo lo del rubro
servidor/tests/                    node:test y PostgreSQL local (core_estructura.test.mjs es del core)
frontend/tests/browser/            Playwright con API simulada
```

Dos marcos en `core/app/router.jsx`: la tienda (`AppLayout`, navbar y footer) y el panel de gestión
(`PanelLayout`). Todo lo que maneja el personal va en `core/app/routes/panel.routes.jsx` y su menú se arma en
`core/config/navbar_config/panel_gestion.js` reutilizando los ítems (roles y `modulo`) de cada dropdown; los
grupos de un rubro salen de `menu.panel` de su `modulo.js`. El core nunca importa archivos de un rubro:
los recibe de los registros de `frontend/src/proyecto/` y de `servidor/src/proyecto/modulos.js`.
El resumen del inicio sale de `GET /api/distribuidora/panel/resumen`, filtrado por rol en el servidor.

No existen `servidor/src/nucleo/`, `models_v2/`, ni `frontend/src/components/ui/`
en esta instalación. No copiar imports o fixtures del gimnasio suponiendo que existen.
Las carpetas `_scaffold/` son moldes para crear módulos nuevos: la app no las usa.

## Comandos reales (desde la raíz)

No hay package.json raíz ni workspaces; cada paquete instala sus dependencias.

| Acción | Comando |
| --- | --- |
| Instalar frontend | `npm --prefix frontend ci` |
| Instalar servidor | `npm --prefix servidor ci` |
| Frontend local | `npm --prefix frontend run dev` |
| Servidor local | `npm --prefix servidor run dev` (ver protección de base) |
| Lint del frontend | `npm --prefix frontend run lint` |
| Build del frontend | `npm --prefix frontend run build` |
| Reglas unitarias | `npm --prefix servidor test` |
| Integración PostgreSQL | `npm --prefix servidor run test:integration` |
| Navegador | `npm --prefix frontend run test:e2e` |
| **Todo, con salida resumida** | `node scripts/verificar.mjs` (tests del servidor, lint y build); `--rapido` (sin build), `--completo` (más integración y Playwright), `--detalle` (salida completa de lo que falle) |
| Precios de demostración (escribe en la base de `.env.local`; nunca en `gc_dist`) | `npm --prefix servidor run seed:precios-demo` (lo corre el usuario). Con `CATALOGO_DEMO_AL_INICIAR=true` lo hace el arranque (`seed/catalogo_demo.js`) |
| Subir fotos del catálogo del cliente a Cloudinary (escribe `seed/imagenes_catalogo.json`) | `npm --prefix servidor run imagenes:subir -- "<carpeta con _indice.json>"` (lo corre el usuario; usa sus claves). Con `IMAGENES_CATALOGO_AL_INICIAR=true` el arranque asigna esas fotos por `cod_ref` a los artículos sin foto (`seed/imagenes_catalogo.js`) |
| Dar de baja el catálogo inicial de demostración (sin `--confirmar` solo cuenta) | `npm --prefix servidor run catalogo:retirar-demo -- --confirmar` (lo corre el usuario; escribe en la base de producción, lee `.env.produccion`) |
| Revisar los `.env` (solo nombres, sin valores) | `npm --prefix servidor run env:verificar` (lo corre el usuario; lee sus `.env.local` y `.env.produccion`) |

Un solo test: `node --test --test-name-pattern="carrito" servidor/tests/ux_rules.test.mjs`;
en Playwright, `npm --prefix frontend run test:e2e -- --project=desktop -g "texto del test"`
(proyectos: `desktop`, `mobile`, `small-mobile`).

No hay Vitest, MSW ni Supertest configurados, ni lint de backend.
No anunciar que se ejecutó una suite inexistente.

Para ahorrar tokens: verificar con `node scripts/verificar.mjs` (o filtrando la salida a totales y fallas)
en vez de leer la salida completa, y correr solo lo afectado mientras se trabaja. Lo pesado lo corre GitHub
Actions en cada push (`.github/workflows/verificar.yml`: servidor con PostgreSQL propio, lint, build y
Playwright). El hook `.githooks/pre-commit` corre `--rapido` antes de cada commit; se activa una vez por copia
del repo con `git config core.hooksPath .githooks`.
`npm --prefix servidor test` corre todos los `servidor/tests/*.test.mjs`; la integración apunta a
`checkout.integration.mjs`.

## Base de datos y pruebas

- Proteger los datos de negocio. No ejecutar migraciones, DDL, seeds, escrituras de prueba,
  scripts de mantenimiento ni sincronizaciones contra la base real como verificación.
- El arranque de `server.js` ejecuta bootstrap y seed; el bootstrap existente puede hacer
  `sync({ alter: true })`. Arrancar el backend no es una comprobación de solo lectura.
  Verificar un destino de desarrollo aislado antes de iniciarlo.
- Un cambio de esquema/modelos requiere una petición que lo incluya o una decisión explícita.
  Si hace falta pero está fuera del alcance, explicar el cambio concreto y continuar lo independiente.
- No agregar sincronizaciones automáticas ni importar las bases/esquemas del gimnasio.
  La conexión actual está en `database/sequelize.js`; la URL sale de `BD_URL` (Supabase).
  Esquemas: `gc_dist` en producción y `gc_dist_test` (predeterminado) para pruebas; solo minúsculas.
- `servidor/tests/ux_rules.test.mjs` prueba reglas sin conexión a la base.
- `checkout.integration.mjs` fuerza localhost, vacía `BD_URL`, crea un schema
  `codex_ux_test_<uuid>` y elimina solo ese schema al terminar. Necesita PostgreSQL local.
  Sus sincronizaciones están limitadas a ese schema temporal; conservar esos límites.
- Playwright levanta solo Vite en `127.0.0.1:4178` y simula la API; no necesita iniciar el backend.
  Usa Chromium en desktop, mobile y small-mobile. No prueba por sí solo la persistencia real.
- No enviar correos, procesar pagos externos ni subir archivos reales al ejecutar pruebas.

## Forma de trabajar

- Explicar en español simple el objetivo y, antes de tocar más de cinco archivos, el plan.
- Revisar `git status`, las instrucciones aplicables y las implementaciones cercanas.
  Respetar cambios del usuario, la rama actual y los worktrees existentes.
- Buscar primero controles, hooks, servicios y configuración reutilizables.
- Continuar autónomamente con el trabajo autorizado. Preguntar solo por decisiones de negocio
  que no se puedan resolver con el código/documentación o por acciones fuera de alcance.
- Cambios enfocados; no extender una tarea con refactors ajenos.
- No hacer commit, push o despliegue salvo instrucción explícita del usuario.
- Al cerrar: qué cambió, verificación real y limitaciones. No afirmar que pasó lo que no se ejecutó.

## Convenciones de implementación

- Archivos nuevos en snake_case; componentes en PascalCase; nombres del negocio en español.
  Conservar convenciones existentes cuando se amplía un archivo.
- `const`, `async/await`, `===`, `?.` y `??`; comentarios sobre decisiones, no sobre lo obvio.
- React: controles genéricos en `controls/`; pantallas y lógica del rubro en `modules/`.
  APIs con el cliente `api/http.js`; usar TanStack Query y los patrones existentes para datos.
  Mantener el adapter de persistencia del carrito, sin reemplazarlo por consultas independientes.
- Hooks antes de returns condicionales. Cubrir carga, error recuperable, vacío y envío pendiente.
  Formularios con React Hook Form/Zod cuando corresponda; labels, teclado y tamaños móviles.
- Reutilizar los tokens de tema y configuración de marca; no cambiar la identidad por aplicar un skill.
- Servidor: rutas autorizan, controladores adaptan HTTP y servicios contienen negocio/SQL.
  Mantener los contratos existentes `{ ok, data, mensaje, codigo, ... }`.
  Los controladores actuales usan try/catch: no quitarlos sin verificar el manejo de errores.
- Validar body/query/params con las utilidades reales; no inventar `req.datos` ni middlewares.
  Usar allowlists de campos y parámetros SQL; no interpolar entradas del usuario.
- Dinero, envío, fusión del carrito y operaciones concurrentes: conservar transacciones,
  locks y claves de idempotencia. Revisar `services/common/` y tests existentes.
- Autorización efectiva en servidor, incluyendo propietario del recurso y módulo habilitado.
  Las rutas del personal usan `requirePermiso(...)` (alcanza con uno) y la interfaz `permisos`/`cumpleAcceso`;
  no asumir privilegios por nombre de rol. `requireRole` queda para `super_admin` y módulos apagados.
  Un permiso nuevo se agrega en `core/permisos_config.js` (core) o `proyecto/permisos_rubros.js` (rubro) y lo sincroniza el arranque (`sincronizarPermisos`).
- Para fechas de negocio usar explícitamente `America/Argentina/Buenos_Aires`.
- Neon: evitar N+1, listas ilimitadas y polling nuevo sin necesidad. El polling existente de
  pedidos es parte del comportamiento actual: evaluar su necesidad antes de cambiarlo.

## Secretos y permisos de Claude

No leer ni mostrar archivos .env reales, tokens, contraseñas o cadenas de conexión.
Variables: en la PC el servidor lee solo `servidor/.env.local` (PostgreSQL local, `BD_URL` vacía) y Vite
`frontend/.env.local`. `*/.env.produccion` tiene lo de Render y Vercel (se pega con "Add from .env" /
"Import .env"); el código no lo lee, salvo los scripts de producción con `node --env-file=.env.produccion`
(`catalogo:retirar-demo`, `admin:verificar`, `imagenes:subir`). Los moldes con valores falsos son
`.env.local.example` y `.env.produccion.example`; un `.env` a secas ya no se usa.
Consultar nombres y ejemplos sanitizados; `VITE_*` es público. No copiar permisos locales
de otro proyecto ni habilitar bypass de permisos. `.claude/settings.json` conserva permisos
existentes y agrega comandos de verificación y restricciones del flujo importado.
Las reglas de herramientas complementan estas instrucciones; no garantizan bloquear todos
los comandos equivalentes de otras shells.

## Skills y revisión

Skills en `.claude/skills/`: `feature`, `api-endpoint`, `react-component`,
`crud-admin`, `auth-rbac`, `dominio-distribuidora`, `e2e-test`, `pre-pr`,
`security-audit`, `perf-audit`, `frontend-design`.
Usar cada uno según el trabajo, no ejecutar auditorías completas para cualquier cambio.
El revisor `.claude/agents/code-reviewer.md` revisa en solo lectura cuando se solicita
una revisión independiente; no exige delegar todo trabajo.

El skill frontend-design ya existía en `frontend/.agents/skills/frontend-design/`.
Su copia en `.claude/skills/` permite invocarlo desde Claude en la raíz; conservar la licencia
y mantener ambas copias iguales si se actualiza ese skill.

## Definición de terminado

Verificar lo afectado con los comandos disponibles y comunicar resultados reales.
Agregar pruebas para lógica de negocio nueva o corregida, con caso válido y error relevante.
No exigir tests nuevos para cambios puramente documentales o de configuración del agente.
Sin secretos, depuración accidental, archivos temporales o cambios de base no autorizados.
Actualizar estas instrucciones si cambian rutas, comandos o arquitectura.
