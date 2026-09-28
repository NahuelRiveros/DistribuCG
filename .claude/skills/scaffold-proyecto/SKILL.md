---
name: scaffold-proyecto
description: Crea la base del proyecto desde cero (npm workspaces con frontend Vite+React y servidor Express+Sequelize, proyecto.config.js, carpeta compartido/, nucleo del servidor, migraciones Umzug, cliente demo, tests). Usar una sola vez al iniciar.
disable-model-invocation: true
---

# Scaffold del proyecto

Objetivo: que TODOS los comandos de `CLAUDE.md` funcionen al terminar. Todo en **JavaScript (ESM)**, archivos `snake_case`.
Las piezas marcadas "Traer" en `docs/ORIGEN_DISTRIBUCG.md` se copian desde DistribuCG adaptándolas (usar la skill `traer-de-distribucg`), no se reescriben de memoria.

## Pasos

1. Verificar `node -v` (>= 22), `npm -v`, y PostgreSQL 17 local (servicio `postgresql-x64-17`). Si el repo no tiene git, proponer `git init` y un primer commit antes de empezar.
   Las bases `mi_eccomerce` y `mi_eccomerce_test` las crea el usuario; el usuario completa `servidor/.env` (nunca leerlo ni pedir la contraseña por el chat). Si la conexión falla, pedirle que revise su `.env` y parar.
2. **Raíz**
   - `package.json` privado con `"workspaces": ["frontend", "servidor"]` y scripts: `dev` (concurrently web+api), `dev:web`, `dev:api`, `test`, `test:api`, `test:web`, `test:e2e`, `lint`, `db:migrar`, `db:migrar:deshacer`, `db:migracion`, `db:seed`.
   - `proyecto.config.js`: `{ cliente: "demo", modulos: { catalogo: true, stock: true, tienda: true, pagos_online: false }, tienda: {...}, pedidos: {...}, stock: {...} }`.
   - `compartido/schemas/`, `compartido/reglas/dinero.js`, `compartido/reglas/pedido_transiciones.js`.
   - `eslint.config.js` (JS recomendado + react + react-hooks), `.prettierrc`, `.gitignore` (node_modules, dist, `.env`, test-results).
3. **servidor/**
   - Dependencias: express, sequelize, pg, umzug, zod, jsonwebtoken, bcrypt, helmet, cors, compression, cookie-parser, express-rate-limit, morgan, dotenv, multer, cloudinary. Dev: vitest, supertest, nodemon.
   - `src/nucleo/`: `env.js` (Zod), `errores.js` (ErrorApp + subclases), `manejador_errores.js`, `validar.js` (middleware Zod → `req.datos`), `db/sequelize.js`, `db/define_model.js`, `db/relaciones.js`, `db/migrador.js` (Umzug + tabla `migraciones`), `auth/`, `paginacion.js`, `consultas.js`.
   - `src/app.js` (crea la app y registra las rutas de los módulos activos según `proyecto.config.js`; exportable para Supertest) y `src/server.js` (conecta la base y escucha). **Sin `sync()`**.
   - `src/modulos/salud/` con `GET /api/salud` + test.
   - Primera migración: usuarios y roles. Seed: roles + super admin desde variables de entorno.
   - `.env.example` con `DATABASE_URL`, `DATABASE_URL_TEST`, `DB_SCHEMA`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT=3001`, Cloudinary, SMTP.
4. **frontend/**
   - `npm create vite@latest frontend -- --template react`; Tailwind 4 (`@tailwindcss/vite`), React Router 7, TanStack Query, axios, React Hook Form, Zod, lucide-react, clsx. Dev: vitest, @testing-library/react, jsdom, msw, @playwright/test.
   - Alias `@/` → `src/` y `@compartido/` → `../compartido/` en `vite.config.js` (+ `server.fs.allow` para la carpeta compartida) y `jsconfig.json`.
   - `src/clientes/demo/` con `marca.js`, `tema.js`, `home.js`, `navbar.js`, `footer.js`, `assets/`, y `src/clientes/index.js` que exporta el cliente activo según `proyecto.config.js`.
   - `src/componentes/layout/` (app_layout, navbar, footer leyendo el cliente activo), `src/componentes/ui/` básicos, `src/api/http.js`, `src/utils/formatear_dinero.js`.
   - Home mínima que lee `clientes/demo/home.js`.
5. `e2e/` con Playwright y un test de humo (abre el Home, ve navbar y footer).
6. Borrar el `index.html` vacío de la raíz del repo.
7. Ejecutar y mostrar salida: `npm install`, `npm run db:migrar`, `npm run db:seed`, `npm run lint`, `npm test`.
8. Actualizar `CLAUDE.md` si algún comando o ruta quedó distinto, y marcar en `docs/ORIGEN_DISTRIBUCG.md` lo que se trajo.
