---
name: pre-pr
description: Checklist de calidad antes de commitear o abrir un PR — lint, tests, migraciones, reglas de CLAUDE.md sobre el diff y mensaje de commit. Usar antes de cada commit importante.
---

# Antes del commit / PR

1. Ejecutar y mostrar resultados reales: `npm run lint`, `npm test`.
2. Revisar el diff (`git status` y `git diff`) contra `CLAUDE.md`:
   - `console.log` de depuración, código comentado, carpetas `sin_usar/`, archivos `.ts`.
   - Modelos usados fuera de servicios; lógica o try/catch en controladores; HTTP dentro de componentes.
   - Cambios de modelo sin migración; migraciones ya aplicadas editadas; `sync(` en cualquier lado.
   - Rutas sin `validar(...)` o sin tests; `create(req.body)`.
   - Stock modificado sin `registrarMovimiento`.
   - Textos/colores de un cliente fuera de `frontend/src/clientes/<id>/`.
   - Archivos que no van (`.env`, `dist/`, dumps `.sql`, `test-results/`).
3. Si hay migraciones: explicar qué hacen y si borran algo.
4. Si cambió la estructura o los comandos: `CLAUDE.md` actualizado en el mismo commit.
5. Proponer mensaje de commit en español estilo Conventional Commits (`feat(stock): ajustes con motivo`) y descripción de PR: qué, por qué, cómo probar, riesgos.
6. No commitear ni hacer push sin confirmación del usuario.
