# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint      # ESLint over the whole project
```

There is no test runner configured in this package. Copy `.env.example` to `.env` before running dev — it must define `VITE_API_URL` (defaults to `http://localhost:3001/api` in dev, `https://dynamic-gym.onrender.com/api` in prod if unset). The backend lives in the sibling `servidor/` directory and must be running for API calls to work.

## Architecture

This is the React frontend of "Moovs", a multi-module gym/kinesiology management SaaS. It's a Vite + React 19 SPA using React Router (data-router style, `src/app/router.jsx`), TanStack Query for server state, react-hook-form + zod for forms, Tailwind v4, and axios.

**Auth flow**: `src/auth/auth_context.jsx` (`AuthProvider`/`useAuth`) holds the logged-in user and the enabled-modules map. On mount, if a JWT exists in `localStorage` (key from `authConfig.storageKey`), it calls `/auth/me` and `/modulos/estado`. All API calls go through the shared axios instance in `src/api/http.js`, which attaches the bearer token on every request and, on a 401 response, clears the token and hard-redirects to `/login`. API modules (`src/api/*_api.js`) are thin wrappers around `http` — one file per backend resource, each function just does an axios call and returns `r.data`.

**Routing & access control**: All routes are registered in `src/app/router.jsx`, each wrapped in `<AppLayout>` and, where restricted, `<ProtectedRoute roles={[...]}>` (`src/components/acceso/protected_route.jsx`). `ProtectedRoute` redirects to `/login` if unauthenticated, or to `/` if the user's `roles` array doesn't intersect the required roles. Known roles (generic, reusable across verticals): `super_admin` (system/licensing), `admin` (business owner), `staff` (generic employee), `profesional` (restricted-access specialist — currently used by kinesiología, reusable by any future module needing "access only to my own assigned clients").

**Business modules toggle**: The gym (`gym`) and kinesiology (`kinesiologia`) modules can be enabled/disabled per installation from `/super-admin/modulos`, backed by the `modulo_negocio` table on the backend (also gated server-side via `requireModuloHabilitado`, so hiding a module in the UI is not the only enforcement). `AuthContext` fetches this once as `modulosHabilitados`; `src/config/modulos_config.js` exposes `moduloHabilitado(modulo, modulosHabilitados)` to filter UI items tagged with `modulo: "gym" | "kinesiologia"` (used in `navbar_config.js`, `footer_config.jsx`). Items without a `modulo` tag are always shown.

**White-label / theming**: `src/config/brand_config.js` defines per-client identity (name, tagline, fonts, color palette) inside a `clientes` map; `clienteActivo` selects the active one, exported as `brandConfig`. `src/index.css` is the single source of truth for design tokens (`--kt-*` colors, `--radius-*`, `--shadow-*`, `--z-*`, `--duration-*`), re-exposed through Tailwind's `@theme` block so both new utility classes (`bg-primary`) and legacy ones (`bg-slate-600`, `text-gray-400`) resolve to the same brand palette. To re-skin the app for a new client, edit `brand_config.js` and `index.css` only — components should not hardcode colors.

**Config-driven UI**: Several cross-cutting UI pieces are declared in `src/config/*` rather than hardcoded in components: `navbar_config.js` (nav items + role/module gating), `footer_config.jsx`, `home_config.js`/`home_iconos.js` (editable homepage content), `audio_config.js` (kiosk check-in sounds), `auth_config.js` (auth endpoints + register form field list). Check these before adding a nav item, footer link, or form field — they're often declarative rather than JSX.

**Directory layout under `src/`**: `api/` (backend calls), `app/` (router + query client setup), `auth/` (auth context — not to be confused with `components/acceso/`, which holds UI: route guard + login/register success modals), `components/` (shared UI, organized `ui/`-primitives-vs-domain — see below), `pages/` (route screens, with `admin/`, `alumnos/`, `estadisticas/`, `super_admin/`, `ventas/` subfolders mirroring the route tree), `hooks/`, `utils/`, `config/`. `sin_usar/` subfolders (e.g. under `pages/admin/kinesiologia/`, `utils/`, and `components/kinesiologia/`) hold dead/parked code — not wired into the router, don't build on top of them without checking first. `pages/_scaffold/` holds copy-paste templates for new CRUD pages (also not wired into the router).

**`components/` structure**: `ui/` — generic, reusable, no business logic (`input_field.jsx`, `select_field.jsx`, `textarea_field.jsx`, `submit_button.jsx`, `form_error.jsx`, `icono_picker.jsx`, `data_grid.jsx`, `confirm_dialog.jsx`). Everything else is grouped by **domain**, not by UI pattern: `stock/`, `planes/`, `pagos/`, `kinesiologia/`, `staff/`, `kiosk/`, `acceso/`, `suscripcion/`, `sistema/`, `alertas/`, `home/`, `brand/`. `layout/` holds the app shell (`app_layout.jsx`, `footer.jsx`) plus `layout/navbar/` for the navbar family. When adding a new shared component: if it's a generic primitive with no domain knowledge, it goes in `ui/`; if it's specific to one feature (a form modal, a domain-specific banner), it goes in (or gets a new) domain folder — don't add it back to a flat `modal/`-style bucket.

**Naming convention**: files and most identifiers are `snake_case.jsx`/`snake_case.js` even for React components (e.g. `home_page.jsx`, `input_field.jsx`) — follow this over the more common camelCase/PascalCase React convention when adding files.

**Deployment**: builds to `dist/`, deployed on Render (see `vercel.json`/env comments) with the frontend and backend served from the same origin in production (`VITE_API_URL=/api`).
