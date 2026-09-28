---
name: api-endpoint
description: Crea un endpoint REST en Express dentro de su módulo (rutas, controlador, servicio), con validación Zod, autorización por rol, errores centralizados y tests con Supertest contra la base de test.
argument-hint: <MÉTODO /ruta — descripción, ej. "POST /api/productos — crear producto (admin, staff)">
---

# Endpoint: $ARGUMENTS

Carpeta: `servidor/src/modulos/<modulo>/`. Si el módulo ya existe, extenderlo; no duplicar.

1. **Schema** en `compartido/schemas/<modulo>.js`: body / query / params. Mensajes de error en español.
2. **Servicio** (`<entidad>_servicio.js`):
   - Reglas de negocio; único lugar que usa modelos.
   - Recibe objetos ya validados; `attributes` explícitos; filtra `eliminado_en: null`.
   - Lanza `NoEncontrado`, `Conflicto`, `SinPermiso`... con `codigo` en MAYÚSCULAS (`PRODUCTO_NO_ENCONTRADO`).
   - `sequelize.transaction()` si toca varias tablas, dinero o stock. Las funciones que puedan componerse aceptan `{ transaction }`.
3. **Controlador** (`<entidad>_controlador.js`): sin try/catch, sin lógica. `res.status(201).json({ ok: true, data })` al crear; `{ ok: true, data, paginacion }` en listados.
4. **Rutas** (`<entidad>_rutas.js`): `requerirModulo('<modulo>')`, `requerirAuth`/`authOpcional`, `requerirRol(...)`, `validar({ body, query, params })`, rate limit si es sensible. Rutas fijas antes de `/:id`. Registrar en el índice del módulo.
5. **Tests** (`<entidad>.test.js`, Supertest):
   - caso feliz (status + forma de la respuesta)
   - 400 por datos inválidos (mensaje en español)
   - 401 sin sesión / 403 con rol incorrecto
   - 404 / 409 según reglas de negocio
   - listados: paginación, búsqueda, filtros
   - módulo apagado → 404
6. Ejecutar `npm run test:api` y mostrar la salida.
7. Informar el contrato final (método, ruta, rol, datos de entrada, respuesta, errores posibles) para usarlo en el frontend.
