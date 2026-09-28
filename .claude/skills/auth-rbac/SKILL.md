---
name: auth-rbac
description: Implementa o modifica autenticación (registro, login, sesión, recuperación de contraseña) y permisos por rol en servidor y frontend. Usar para todo lo relacionado con usuarios, sesiones y permisos.
---

# Autenticación y roles (módulo `usuarios`, dentro de `nucleo`)

Base: `auth_middleware.js`, `auth_tokens.js` y `password_recovery_*` de DistribuCG (traer con `traer-de-distribucg`).

## Servidor
- `usuario` (email único en minúsculas, `contrasena` con bcrypt, `activo`, `eliminado_en`), `rol` (`super_admin`, `admin`, `staff`, `cliente`), `usuario_rol`.
- JWT en `Authorization: Bearer`, con `sub` y versión de contraseña (`pv`): si cambia la contraseña, los tokens viejos dejan de valer. Algoritmo fijo `HS256`, expiración definida.
- Middlewares: `requerirAuth`, `authOpcional`, `requerirRol(...roles)`. Chequeo de **dueño** en servicios (un cliente solo ve SUS pedidos y perfil).
- Registro público solo si `proyecto.config.js → usuarios.registro_publico`. Siempre crea rol `cliente`.
- Login: mensaje genérico ("Email o contraseña incorrectos"), rate limit por IP + email.
- Recuperación: token aleatorio de un solo uso, guardado hasheado, vence en ~20 min, respuesta igual exista o no el email.
- Nunca devolver `contrasena` ni tokens internos (`attributes` explícitos).

## Frontend
- `auth_context.jsx` + `useAuth()`; interceptor de `http.js` que ante 401 limpia la sesión y lleva a `/login` guardando la ruta de retorno.
- `<RutaProtegida roles={['admin']}>`. Ocultar botones sin permiso es solo comodidad: la seguridad real está en el servidor.
- Mejora futura sugerida (no obligatoria): mover el token de `localStorage` a cookie `httpOnly` + refresh token.

## Tests
Login correcto/incorrecto, token vencido, token viejo tras cambiar contraseña, 401/403 por rol, acceso a pedido ajeno → 404.
