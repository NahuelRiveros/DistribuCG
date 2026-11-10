# CoreSistem

Base para sistemas web de gestión: ingreso, personal, roles y permisos, panel de gestión,
suscripción, carrito y catálogo genéricos, importación de planillas, facturación (ARCA) y
pruebas. Cada proyecto nuevo suma su **rubro** (el negocio) y su **configuración de cliente**.

JavaScript (ESM) en todo el sistema, nunca TypeScript. Frontend: React, Vite, Tailwind, TanStack Query.
Servidor: Node, Express, Sequelize y PostgreSQL.

## Las tres partes

| Carpeta | Qué tiene | ¿Se toca en un proyecto nuevo? |
| --- | --- | --- |
| `core/`, `frontend/src/core/`, `servidor/src/core/` | Todo lo reutilizable: componentes, hooks, APIs, sesión, permisos, panel, servicios, modelos, middleware | No. Se mejora acá y se sube al repo del core |
| `proyecto/`, `frontend/src/proyecto/`, `servidor/src/proyecto/` | Lo de cada cliente: nombre, logos, colores, textos, URLs, datos fiscales y qué rubros tiene | Sí, es lo único que se completa |
| `frontend/src/modules/<rubro>/`, `servidor/src/modulos/<rubro>/`, `rubros/<rubro>/` | El negocio (ej. distribuidora: pedidos, cobros, catálogo) | Se crea el del proyecto a partir de los moldes `_scaffold` |

Regla: **el core nunca importa un rubro** (lo controla un test, COR-01). Recibe los rubros por los
registros de `proyecto/` (`modulos_activos.js`, `pantallas_modulos.jsx`, `modulos.js`, `gate_config.js`).

## Arrancar un proyecto nuevo

1. Clonar este repo en una carpeta nueva.
2. `node scripts/nuevo_proyecto.mjs`: copia `plantilla_proyecto/` a su lugar sin pisar nada.
3. Buscar `[COMPLETAR]` y llenar los datos del cliente (marca, colores, URLs, `.env`).
4. `npm --prefix frontend ci` y `npm --prefix servidor ci`.
5. Copiar `servidor/.env.local.example` a `servidor/.env.local` y `frontend/.env.local.example` a
   `frontend/.env.local`, con una base PostgreSQL local.
6. `node scripts/verificar.mjs`: tests, lint y build.

## Mantener el core actualizado desde un proyecto

El proyecto donde se mejora el core tiene un segundo repositorio git en `.git-core/` que apunta a
este repo. `core_lista.txt` dice qué archivos son del core.

- `node scripts/core_subir.mjs`: muestra qué cambió en el core, sin subir nada.
- `node scripts/core_subir.mjs --subir`: hace el commit y lo sube.

Solo viajan archivos ya commiteados en el proyecto, y nunca `proyecto/`, los rubros ni los `.env`.
