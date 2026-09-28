---
name: feature
description: Orquesta una funcionalidad completa en fases Base de datos → schemas compartidos → servidor → frontend → E2E, con plan previo y verificación en cada fase. Usar cuando se pida algo que cruza varias capas (ej. "alertas de stock bajo", "cupones de descuento").
argument-hint: <descripción de la funcionalidad>
---

# Funcionalidad: $ARGUMENTS

## Fase 0 — Plan (todavía sin código)
1. Leer lo relacionado: modelos y servicios del módulo, pantallas existentes, `proyecto.config.js`. Si existe algo parecido en DistribuCG (`docs/ORIGEN_DISTRIBUCG.md`), mencionarlo.
2. Presentar al usuario, en español simple:
   - Reglas de negocio entendidas + **preguntas abiertas** (precios, permisos, casos raros).
   - A qué módulo pertenece (o si es un módulo nuevo que debe poder apagarse).
   - Cambios en la base (tablas, columnas, índices, constraints).
   - Endpoints (método, ruta, rol, datos que recibe y devuelve).
   - Pantallas, componentes y hooks; qué se configura por cliente.
   - Lista de archivos a crear o modificar.
3. Esperar confirmación.

## Fase 1 — Base de datos
Skill `db-model`. Verificar: `npm run db:migrar` y `npm run db:migrar:deshacer` funcionan.

## Fase 2 — Schemas compartidos
Schemas Zod en `compartido/schemas/<modulo>.js` (un schema usado por servidor y formularios).

## Fase 3 — Servidor
Skill `api-endpoint` por cada endpoint. Verificar: `npm run test:api`.

## Fase 4 — Frontend
Skills `react-component` / `crud-admin`. Si agrega ítems al navbar, los aporta el módulo, no se escriben en un cliente. Verificar: `npm run test:web`.

## Fase 5 — E2E y cierre
- Flujos críticos (pedido, login, movimiento de stock): skill `e2e-test`.
- Skill `pre-pr`.
- Resumen: qué se hizo, cómo probarlo a mano, decisiones tomadas, pendientes.

Si un test falla en una fase, se arregla antes de pasar a la siguiente.
