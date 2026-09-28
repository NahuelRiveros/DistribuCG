---
name: security-audit
description: Audita la seguridad del proyecto o de un módulo (OWASP Top 10, SQL injection en Sequelize, permisos, secretos, dependencias, headers, validación). Genera un reporte priorizado con archivo:línea y solución. No modifica código salvo que se pida.
argument-hint: [módulo o ruta; vacío = todo el proyecto]
---

# Auditoría de seguridad: $ARGUMENTS

(Si no se indicó módulo, auditar todo el proyecto.)

Reportar cada hallazgo con gravedad (CRÍTICA / ALTA / MEDIA / BAJA), `archivo:línea`, cómo se podría aprovechar en concreto, y la solución. Explicar en español simple.

## Revisar
1. **SQL injection**: `sequelize.query` con `${}` de datos del usuario, `Sequelize.literal` con input, `order` armado con texto del cliente sin lista blanca.
2. **Validación**: toda ruta con body/query/params pasa por `validar(schema)`.
3. **Permisos**: rutas privadas con `requerirAuth`; admin con `requerirRol`; servicios que comprueban que el recurso sea del usuario (IDOR); rutas de módulos apagados → 404.
4. **Negocio**: precios/totales recalculados en servidor; cantidades negativas o gigantes rechazadas; stock solo por `registrarMovimiento`; cobros que no superen el saldo; transiciones de estado válidas.
5. **Mass assignment**: ningún `create(req.body)` / `update(req.body)`.
6. **Auth**: bcrypt, JWT con secreto fuerte y expiración, `algorithms` fijo, rate limit en login/registro/recuperación/pedido.
7. **Secretos**: nada en git (`git grep` de claves), `.env` en `.gitignore`, nada sensible en logs ni en variables `VITE_*`.
8. **Headers/CORS**: helmet activo, CORS con lista blanca.
9. **Frontend**: `dangerouslySetInnerHTML`, links con URLs del usuario (`javascript:`), datos sensibles en `localStorage`.
10. **Subida de archivos**: tipo y tamaño validados (multer), solo roles permitidos.
11. **Dependencias**: `npm audit --omit=dev` en `frontend/` y `servidor/`.

## Salida
Tabla resumen + detalle. Terminar con "Top 3 para arreglar ya" y ofrecer aplicar las soluciones.
