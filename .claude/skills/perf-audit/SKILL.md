---
name: perf-audit
description: Audita rendimiento de base de datos, servidor y frontend — consultas N+1 en Sequelize, índices faltantes (EXPLAIN ANALYZE), respuestas pesadas, renders de más, tamaño del bundle. Usar cuando algo anda lento o antes de publicar.
argument-hint: [pantalla, endpoint o módulo]
---

# Auditoría de rendimiento: $ARGUMENTS

## Base de datos
1. Activar `logging: console.log` de Sequelize en local, recorrer el flujo y detectar N+1 (la misma consulta repetida en un bucle).
2. Para las consultas frecuentes o lentas: `EXPLAIN (ANALYZE, BUFFERS)` y buscar `Seq Scan` en tablas grandes.
3. Proponer índices (compuestos en el orden del filtro, parciales `WHERE eliminado_en IS NULL`, `pg_trgm` para buscar productos) como migración con la skill `db-model`.
4. Verificar `attributes` explícitos, `distinct: true` en `findAndCountAll` con `include`, y paginación en todos los listados.
5. Pool de conexiones acorde al plan de Neon/Render.

## Servidor
- `compression` activo; `Cache-Control` en catálogo público; tareas pesadas (importaciones, mails) fuera del request.

## Frontend
- `npm run build -w frontend` y revisar tamaño de chunks; `React.lazy` por ruta (sobre todo pantallas admin).
- `staleTime` adecuado en TanStack Query para catálogo; evitar refetch innecesarios.
- Listas largas → virtualización; imágenes Cloudinary con tamaño y formato automático (`f_auto,q_auto,w_...`) y `loading="lazy"`.

## Salida
Hallazgos ordenados por impacto, con medición antes/después cuando se aplique una mejora.
