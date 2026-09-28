---
name: db-model
description: Crea o modifica tablas de PostgreSQL con una migración Umzug (up/down) y su modelo Sequelize, con índices, constraints y seed. Usar para cualquier cambio en la estructura de la base.
argument-hint: <cambio, ej. "tabla proveedor y relación opcional con producto">
---

# Cambio en la base de datos: $ARGUMENTS

1. Leer los modelos del módulo y las últimas migraciones en `servidor/src/migraciones/` para respetar convenciones.
2. Diseñar según `CLAUDE.md`:
   - `snake_case` singular, `creado_en`/`actualizado_en`, `eliminado_en` si es entidad de negocio.
   - Dinero `DECIMAL(12,2)`; cantidades `INTEGER` con `CHECK (>= 0)` donde aplique.
   - Índice en cada FK y en columnas de filtro/orden; `UNIQUE` en SKU/email/slug (parcial `WHERE eliminado_en IS NULL` si hay borrado lógico).
   - FKs con `ON DELETE` explícito (`RESTRICT` para datos de negocio, `CASCADE` solo para hijos puros como ítems de carrito).
   - Estados como `STRING` + `CHECK` o tabla de catálogo, alineados con `proyecto.config.js`.
3. Crear migración: `npm run db:migracion -- <verbo_sustantivo>` (ej. `crear_proveedor`). Escribir `up` y `down` con `queryInterface` (o `sequelize.query` con SQL fijo para CHECK/índices parciales/pg_trgm). **Nunca** `sync()`.
4. Si agrega `NOT NULL` a una tabla con datos: default o migración en dos pasos. Si borra o renombra: avisar al usuario y hacerlo en dos pasos.
5. Modelo en `servidor/src/modulos/<modulo>/<entidad>_modelo.js` con `defineModel()`, idéntico a la migración. Relaciones en el archivo de relaciones del módulo con `aplicarRelaciones()`.
6. Seed idempotente si hace falta (`findOrCreate`).
7. Ejecutar `npm run db:migrar`, luego `npm run db:migrar:deshacer` y `npm run db:migrar` de nuevo (prueba que `down` funciona). Mostrar salida.
8. Mostrar al usuario el SQL/migración y explicar en simple qué cambia en la base.
