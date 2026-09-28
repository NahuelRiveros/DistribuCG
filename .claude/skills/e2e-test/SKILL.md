---
name: e2e-test
description: Escribe tests de punta a punta con Playwright para flujos críticos (armar y enviar pedido, login, alta de producto, ajuste de stock, gestión de pedido). Usar al cerrar una funcionalidad que un usuario recorre completa.
argument-hint: <flujo, ej. "invitado arma carrito, se registra y envía pedido">
---

# Test E2E: $ARGUMENTS

1. Archivo en `e2e/<flujo>.spec.js`. Page Objects en `e2e/paginas/` si la pantalla se reutiliza.
2. Datos: crear lo necesario por API o seed propio en `beforeEach`; no depender del orden de otros tests. Usuarios por rol en `e2e/fixtures.js` con `storageState`.
3. Selectores: `getByRole`, `getByLabel`, `getByText`. Nada de clases CSS.
4. Sin `waitForTimeout`: usar `await expect(...).toBeVisible()`.
5. Verificar el efecto real, no solo la pantalla: por ejemplo, después de enviar un pedido consultar la API y comprobar que el stock bajó y existe el movimiento.
6. Probar en escritorio y mobile (proyectos de Playwright, como en DistribuCG).
7. Ejecutar `npm run test:e2e -- e2e/<flujo>.spec.js` y mostrar la salida; si falla, adjuntar el trace.
